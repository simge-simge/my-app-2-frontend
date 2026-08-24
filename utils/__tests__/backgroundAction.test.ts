import { runInBackground, subscribeToBackgroundActions } from "../backgroundAction"
import { waitFor } from "@testing-library/react-native"

describe("runInBackground", () => {
  it("does not block the caller and reports completion", async () => {
    let finish!: (value: string) => void
    const onSuccess = jest.fn()
    const listener = jest.fn()
    const unsubscribe = subscribeToBackgroundActions(listener)

    expect(runInBackground(() => new Promise((resolve) => { finish = resolve }), { onSuccess, onError: jest.fn() })).toBeUndefined()
    await Promise.resolve()
    finish("saved")
    await waitFor(() => expect(listener).toHaveBeenCalledTimes(1))
    expect(listener).toHaveBeenCalledWith({
      event: undefined,
      status: "completed",
      result: "saved",
      optimisticResult: undefined,
    })
    expect(onSuccess).toHaveBeenCalledWith("saved")
    unsubscribe()
  })

  it("reports optimistic, completed, and failed states", async () => {
    const listener = jest.fn()
    const unsubscribe = subscribeToBackgroundActions(listener)

    runInBackground(() => Promise.resolve("saved"), {
      event: "books",
      optimisticResult: "draft",
      onError: jest.fn(),
    })
    expect(listener).toHaveBeenCalledWith({
      event: "books",
      status: "pending",
      result: "draft",
      optimisticResult: "draft",
    })
    await waitFor(() => expect(listener).toHaveBeenCalledWith({
      event: "books",
      status: "completed",
      result: "saved",
      optimisticResult: "draft",
    }))

    runInBackground(() => Promise.reject(new Error("offline")), {
      event: "books",
      optimisticResult: "failed draft",
      onError: jest.fn(),
    })
    await waitFor(() => expect(listener).toHaveBeenCalledWith({
      event: "books",
      status: "failed",
      optimisticResult: "failed draft",
    }))
    unsubscribe()
  })

  it("replays an active optimistic update to late subscribers", async () => {
    let finish!: (value: string) => void
    runInBackground(() => new Promise((resolve) => { finish = resolve }), {
      event: "books",
      optimisticResult: "draft",
      onError: jest.fn(),
    })
    await waitFor(() => expect(finish).toBeDefined())

    const listener = jest.fn()
    const unsubscribe = subscribeToBackgroundActions(listener)
    expect(listener).toHaveBeenCalledWith({
      event: "books",
      status: "pending",
      result: "draft",
      optimisticResult: "draft",
    })

    finish("saved")
    await waitFor(() => expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      event: "books",
      status: "completed",
      result: "saved",
    })))
    unsubscribe()
  })

  it("handles a late error without notifying completion", async () => {
    const error = new Error("offline")
    const onError = jest.fn()
    const listener = jest.fn()
    const unsubscribe = subscribeToBackgroundActions(listener)

    runInBackground(() => Promise.reject(error), { onError })
    await waitFor(() => expect(onError).toHaveBeenCalledWith(error))
    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })
})
