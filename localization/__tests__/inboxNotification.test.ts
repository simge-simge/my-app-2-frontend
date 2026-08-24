import { localizeInboxNotification } from "@/localization/inboxNotification"
import { tr, type TranslationKey } from "@/localization/translations"
import type { InboxNotification } from "@/services/inbox"

const translate = (key: TranslationKey, values?: Record<string, string | number>) => {
  const template = tr[key]
  return template.replace(/{{(\w+)}}/g, (_, valueKey: string) => String(values?.[valueKey] ?? `{{${valueKey}}}`))
}

const notification = (overrides: Partial<InboxNotification>): InboxNotification => ({
  id: "notification-1",
  type: "book_borrow_requested",
  title: "Borrow request",
  message: 'Ada would like to borrow "The Dispossessed".',
  metadata: {},
  read_at: null,
  created_at: "2026-01-03T12:00:00Z",
  ...overrides,
})

describe("inbox notification localization", () => {
  it("translates dynamic borrow request copy into Turkish", () => {
    expect(localizeInboxNotification(notification({}), "tr", translate)).toEqual({
      title: "Ödünç alma isteği",
      message: "Ada, “The Dispossessed” kitabını ödünç almak istiyor.",
    })
  })

  it("translates dynamic community copy into Turkish", () => {
    expect(localizeInboxNotification(notification({
      type: "community_member_added",
      title: "Community member added",
      message: "Ada joined Kadıköy Readers.",
    }), "tr", translate)).toEqual({
      title: "Topluluğa üye eklendi",
      message: "Ada, Kadıköy Readers topluluğuna katıldı.",
    })
  })

  it("preserves server copy in English", () => {
    const original = notification({})
    expect(localizeInboxNotification(original, "en", translate)).toEqual({
      title: original.title,
      message: original.message,
    })
  })
})
