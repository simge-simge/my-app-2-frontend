import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { useLocalSearchParams } from "expo-router"

import ChatScreen from "../[conversationId]"
import { getConversation, sendMessage, type ChatMessage, type ConversationDetail } from "@/services/messages"

jest.mock("@/services/messages", () => ({ getConversation: jest.fn(), sendMessage: jest.fn() }))

const detail: ConversationDetail = {
  conversation: {
    id: "conversation", match_id: "match", user_a: "me", user_b: "other",
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
    other_user: { id: "other", display_name: "Reader", avatar_url: null, messaging_enabled: true },
    last_message: null,
  },
  messages: [], current_user_id: "me", current_messaging_enabled: true,
}

function deferredMessage() {
  let resolve!: (message: ChatMessage) => void
  let reject!: (error: Error) => void
  const promise = new Promise<ChatMessage>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function message(id: string, body: string): ChatMessage {
  return { id, body, conversation_id: "conversation", sender_id: "me", created_at: "2026-01-01T00:00:00Z" }
}

beforeEach(() => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ conversationId: "conversation" })
  jest.mocked(getConversation).mockResolvedValue(detail)
})

it("shows a message immediately and keeps the composer available while Sending\u2026", async () => {
  const request = deferredMessage()
  jest.mocked(sendMessage).mockReturnValue(request.promise)
  render(<ChatScreen />)
  const input = await screen.findByPlaceholderText("Type a message")
  fireEvent.changeText(input, "Hello")
  fireEvent.press(screen.getByLabelText("Send"))

  expect(screen.getByText("Hello")).toBeTruthy()
  expect(screen.getByText("Sending\u2026")).toBeTruthy()
  expect(input.props.value).toBe("")
  expect(input.props.editable).toBe(true)
  fireEvent.changeText(input, "Next draft")

  await act(async () => { request.resolve(message("saved", "Hello")) })
  expect(screen.getAllByText("Hello")).toHaveLength(1)
  expect(screen.queryByText("Sending\u2026")).toBeNull()
  expect(input.props.value).toBe("Next draft")
})

it("keeps failed messages available for retry without overwriting a new draft", async () => {
  const request = deferredMessage()
  const retry = deferredMessage()
  jest.mocked(sendMessage).mockReturnValueOnce(request.promise).mockReturnValueOnce(retry.promise)
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined)
  try {
    render(<ChatScreen />)
    const input = await screen.findByPlaceholderText("Type a message")
    fireEvent.changeText(input, "Hello")
    fireEvent.press(screen.getByLabelText("Send"))
    fireEvent.changeText(input, "Next draft")
    await act(async () => { request.reject(new Error("Offline")) })

    expect(input.props.value).toBe("Next draft")
    fireEvent.press(screen.getByRole("button", { name: "Your message could not be sent. Tap to retry" }))
    expect(sendMessage).toHaveBeenCalledTimes(2)
    await act(async () => { retry.resolve(message("saved", "Hello")) })
    expect(screen.getAllByText("Hello")).toHaveLength(1)
    expect(screen.queryByText(/Tap to retry/)).toBeNull()
  } finally {
    consoleError.mockRestore()
  }
})

it("reconciles concurrent sends that finish out of order", async () => {
  const first = deferredMessage()
  const second = deferredMessage()
  jest.mocked(sendMessage).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
  render(<ChatScreen />)
  const input = await screen.findByPlaceholderText("Type a message")
  for (const body of ["First", "Second"]) {
    fireEvent.changeText(input, body)
    fireEvent.press(screen.getByLabelText("Send"))
  }
  expect(sendMessage).toHaveBeenCalledTimes(2)
  await act(async () => { second.resolve(message("second", "Second")) })
  await act(async () => { first.resolve(message("first", "First")) })
  expect(screen.getAllByText("First")).toHaveLength(1)
  expect(screen.getAllByText("Second")).toHaveLength(1)
  expect(screen.queryByText("Sending\u2026")).toBeNull()
})


