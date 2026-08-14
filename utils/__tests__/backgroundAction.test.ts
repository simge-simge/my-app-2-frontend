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
    expect(onSuccess).toHaveBeenCalledWith("saved")
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
