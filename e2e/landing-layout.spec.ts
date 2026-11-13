import { expect, test } from "@playwright/test"

test("keeps mobile how-it-works images visible through navigation and resizing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")

  for (const width of [360, 390, 600]) {
    await page.setViewportSize({ width, height: 844 })
    const tabs = page.getByRole("tab")
    await expect(tabs).toHaveCount(3)

    for (let index = 0; index < 3; index++) {
      await tabs.nth(index).click()
      const title = (await tabs.nth(index).getAttribute("aria-label"))!.split(": ")[1]
      const image = page.getByRole("img", { name: title, exact: true })
      await expect(image).toBeVisible()
      await expect.poll(async () => image.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        return rect.width > 250 && rect.height > 250 && rect.left >= 0 && rect.right <= window.innerWidth
      })).toBe(true)
      await expect.poll(async () => image.evaluate((element) =>
        element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0,
      )).toBe(true)
    }
  }

  await page.setViewportSize({ width: 1024, height: 900 })
  await expect(page.getByRole("tab")).toHaveCount(0)
  for (const title of ["Add your books", "Discover nearby reads", "Match and exchange"]) {
    await expect(page.getByRole("img", { name: title, exact: true })).toBeVisible()
  }
})
