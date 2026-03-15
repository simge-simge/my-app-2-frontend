import { apiFetch } from "./api"

export type SwipeDirection = "left" | "right"

export type CreateSwipeInput = {
  target_book_id: string
  target_owner_user_id: string
  direction: SwipeDirection
}

export type SwipeRecord = {
  id: string
  swiper_user_id: string
  target_book_id: string
  target_owner_user_id: string
  direction: SwipeDirection
  created_at: string
}

export type MatchRecord = {
  id: string
  user_a: string
  book_a: string
  user_b: string
  book_b: string
  created_at: string
}

export type CreateSwipeResponse = {
  swipe: SwipeRecord[]
  match: MatchRecord[] | null
}

export function createSwipe(data: CreateSwipeInput) {
  return apiFetch("/swipes/", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<CreateSwipeResponse>
}
