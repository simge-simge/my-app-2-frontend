type BackgroundActionOptions<T> = {
  event?: string
  onSuccess?: (result: T) => void | Promise<void>
  onError: (error: unknown) => void | Promise<void>
}

const completionListeners = new Set<(event?: string) => void>()

export function subscribeToBackgroundActions(listener: (event?: string) => void) {
  completionListeners.add(listener)
  return () => { completionListeners.delete(listener) }
}

/**
 * Starts persistence after the caller has committed its optimistic UI update.
 * Errors are deliberately handled here so fire-and-forget actions never create
 * unhandled promise rejections.
 */
export function runInBackground<T>(
  action: () => Promise<T>,
  { event, onSuccess, onError }: BackgroundActionOptions<T>,
) {
  void Promise.resolve()
    .then(action)
    .then(
      (result) => {
        completionListeners.forEach((listener) => listener(event))
        if (onSuccess) void Promise.resolve(onSuccess(result)).catch(console.error)
      },
      (error) => { void onError(error) },
    )
}
