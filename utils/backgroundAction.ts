type BackgroundActionOptions<T> = {
  event?: string
  optimisticResult?: unknown
  onSuccess?: (result: T) => void | Promise<void>
  onError: (error: unknown) => void | Promise<void>
}

export type BackgroundActionUpdate = {
  event: string | undefined
  status: "pending" | "completed" | "failed"
  result?: unknown
  optimisticResult?: unknown
}

type BackgroundActionListener = (update: BackgroundActionUpdate) => void

const completionListeners = new Set<BackgroundActionListener>()
const pendingUpdates = new Set<BackgroundActionUpdate>()

export function subscribeToBackgroundActions(listener: BackgroundActionListener) {
  completionListeners.add(listener)
  pendingUpdates.forEach((update) => listener(update))
  return () => { completionListeners.delete(listener) }
}

/**
 * Starts persistence after the caller has committed its optimistic UI update.
 * Errors are deliberately handled here so fire-and-forget actions never create
 * unhandled promise rejections.
 */
export function runInBackground<T>(
  action: () => Promise<T>,
  { event, optimisticResult, onSuccess, onError }: BackgroundActionOptions<T>,
) {
  let pendingUpdate: BackgroundActionUpdate | undefined
  if (optimisticResult !== undefined) {
    pendingUpdate = {
      event,
      status: "pending",
      result: optimisticResult,
      optimisticResult,
    }
    pendingUpdates.add(pendingUpdate)
    const update = pendingUpdate
    completionListeners.forEach((listener) => listener(update))
  }

  void Promise.resolve()
    .then(action)
    .then(
      (result) => {
        if (pendingUpdate) pendingUpdates.delete(pendingUpdate)
        completionListeners.forEach((listener) => listener({
          event,
          status: "completed",
          result,
          optimisticResult,
        }))
        if (onSuccess) void Promise.resolve(onSuccess(result)).catch(console.error)
      },
      (error) => {
        if (pendingUpdate) pendingUpdates.delete(pendingUpdate)
        if (optimisticResult !== undefined) {
          completionListeners.forEach((listener) => listener({
            event,
            status: "failed",
            optimisticResult,
          }))
        }
        void onError(error)
      },
    )
}
