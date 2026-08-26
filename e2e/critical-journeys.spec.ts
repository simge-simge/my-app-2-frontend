import { expect, type Page, test } from "@playwright/test"

const book = {
  id: "30000000-0000-0000-0000-000000000002",
  owner_id: "10000000-0000-0000-0000-000000000002",
  owner_name: "Ada Reader",
  community_id: "20000000-0000-0000-0000-000000000001",
  community_name: "North Readers",
  title: "The Left Hand of Darkness",
  author: "Ursula K. Le Guin",
  description: "A science-fiction classic.",
  cover_url: null,
  isbn: null,
  status: "available",
  created_at: "2026-01-02T12:00:00Z",
}

async function mockBoundaries(page: Page) {
  await page.route("**/*", async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.pathname.includes("/auth/v1/token")) {
      const timestamp = "2026-01-02T12:00:00Z"
      await route.fulfill({ json: { access_token: "e2e-token", token_type: "bearer", expires_in: 3600, expires_at: 4102444800, refresh_token: "refresh", user: { id: "10000000-0000-0000-0000-000000000001", email: "reader@example.com", aud: "authenticated", role: "authenticated", app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, identities: [], created_at: timestamp, updated_at: timestamp, confirmed_at: timestamp, last_sign_in_at: timestamp, is_anonymous: false } } })
      return
    }
    const path = `${url.pathname}${url.search}`
    const isApiRequest = ["fetch", "xhr"].includes(request.resourceType()) && ["/profile/", "/inbox/", "/books/", "/matches/", "/swipes/"].some((prefix) => url.pathname.startsWith(prefix))
    if (!isApiRequest) return route.continue()
    if (path === "/profile/me/") return route.fulfill({ json: { id: "10000000-0000-0000-0000-000000000001", display_name: "Current Reader", location_id: null, location: null, avatar_url: null, contacts: {}, community_id: "20000000-0000-0000-0000-000000000001", community_name: "North Readers", community_location: { id: "60000000-0000-0000-0000-000000000003", name: "Kadıköy", display_name: "Kadıköy, İstanbul, Türkiye", type: "district", parent_id: "60000000-0000-0000-0000-000000000002", country_code: "TR" }, community_public: true, admin: false, is_app_admin: false, pending_community_name: null, pending_community_request_id: null, created_at: "2025-01-01T00:00:00Z" } })
    if (path === "/inbox/") return route.fulfill({ json: { notifications: [], community_requests: [], book_borrow_requests: [], unread_count: 0 } })
    if (path === "/books/feed") return route.fulfill({ json: [book] })
    if (path === "/swipes/") return route.fulfill({ json: { swipe: [], match: [{ id: "match-1" }] } })
    if (path === "/books/me") return route.fulfill({ json: [{ ...book, owner_id: "10000000-0000-0000-0000-000000000001", title: "My Owned Book" }] })
    if (path.startsWith("/books/search?")) return route.fulfill({ json: [book] })
    if (path === `/books/${book.id}`) return route.fulfill({ json: book })
    if (path.startsWith("/profile/me/search?")) return route.fulfill({ json: [{ id: book.owner_id, display_name: "Ada Reader", avatar_url: null, community_id: book.community_id, community_name: "North Readers", admin: false }] })
    if (path === "/profile/members/10000000-0000-0000-0000-000000000003") return route.fulfill({ status: 403, json: { detail: "Member libraries are only visible within your community" } })
    if (path === `/profile/members/${book.owner_id}`) return route.fulfill({ json: { member: { id: book.owner_id, display_name: "Ada Reader", avatar_url: null, community_id: book.community_id, community_name: "North Readers", admin: false, created_at: "2025-01-01T00:00:00Z" }, books: [book] } })
    if (path === "/matches/") return route.fulfill({ json: [{ match_id: "match-1", created_at: "2026-01-02T12:00:00Z", my_book: { ...book, title: "My Owned Book" }, their_book: book, other_user: { id: book.owner_id, display_name: "Ada Reader", avatar_url: null, admin: false }, revealed: false, my_revealed: false, their_revealed: false, contacts: null }] })
    if (path === "/matches/match-1") return route.fulfill({ json: { match_id: "match-1", created_at: "2026-01-02T12:00:00Z", my_book: { ...book, title: "My Owned Book" }, their_book: book, other_user: { id: book.owner_id, display_name: "Ada Reader", avatar_url: null, admin: false }, revealed: false, my_revealed: false, their_revealed: false, contacts: null } })
    await route.fulfill({ json: [] })
  })
}

async function login(page: Page) {
  await page.goto("/login")
  // Wait for the entrance animation to settle before interacting with the
  // controlled inputs; trial mode performs no click.
  await page.getByRole("button", { name: "Log in" }).click({ trial: true })
  await page.getByLabel("Email").pressSequentially("reader@example.com")
  await page.getByLabel("Password").pressSequentially("secret123")
  await expect(page.getByLabel("Email")).toHaveValue("reader@example.com")
  await expect(page.getByLabel("Password")).toHaveValue("secret123")
  await page.getByRole("button", { name: "Log in" }).click()
  await expect(page.getByText("Hello, Current Reader")).toBeVisible()
}

test.beforeEach(async ({ page }) => mockBoundaries(page))

test("login, show interest in discovery, and open the new match", async ({ page }) => {
  await login(page)
  await page.getByRole("tab", { name: "Explore" }).click()
  const card = page.getByLabel("Swipe The Left Hand of Darkness")
  await expect(card).toBeVisible()
  const box = await card.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width / 2 + 170, box!.y + box!.height / 2, { steps: 8 })
  await page.mouse.up()
  await expect(page.getByRole("heading", { name: "Match Details" })).toBeVisible()
})

test("login, search a book, and open its details", async ({ page }) => {
  await login(page)
  await page.getByRole("tab", { name: "Search" }).click()
  await page.getByPlaceholder("Search books...").fill("Le Guin")
  await page.getByRole("button", { name: "The Left Hand of Darkness by Ursula K. Le Guin" }).click()
  await expect(page.getByText("A science-fiction classic.")).toBeVisible()
})

test("search a community member, open their library, then open a book", async ({ page }) => {
  await login(page)
  await page.getByRole("tab", { name: "Search" }).click()
  await page.getByRole("button", { name: "Search Users" }).click()
  await page.getByPlaceholder("Search users...").fill("Ada")
  await page.getByRole("button", { name: "View Ada Reader's library" }).click()
  await expect(page.getByText("Ada Reader's library")).toBeVisible()
  await page.getByRole("button", { name: "The Left Hand of Darkness by Ursula K. Le Guin" }).click()
  await expect(page.getByText("A science-fiction classic.")).toBeVisible()
})

test("open owned library/add-book and match details", async ({ page }) => {
  await login(page)
  await page.getByRole("tab", { name: "Library" }).click()
  await expect(page.getByText("My Owned Book")).toBeVisible()
  await page.getByRole("button", { name: "Add book" }).click()
  await page.getByRole("button", { name: "Add details manually" }).click()
  await expect(page.getByText("Enter the details for the book you want in your library")).toBeVisible()
  await page.goBack()
  await page.getByRole("tab", { name: "Matches" }).click()
  await page.getByText("Pending").click()
  await expect(page.getByText("Match Details")).toBeVisible()
})

test("rejects an unauthorized community library", async ({ page }) => {
  await page.goto("/members/10000000-0000-0000-0000-000000000003")
  await expect(page.getByText("You can only view libraries belonging to members of your community.")).toBeVisible()
})
