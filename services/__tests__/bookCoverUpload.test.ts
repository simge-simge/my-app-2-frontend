import { Platform } from "react-native"
import type { ImagePickerAsset } from "expo-image-picker"

import { uploadBookCover } from "../books"

const mockUpload = jest.fn()
const mockGetPublicUrl = jest.fn()
const mockExpoFile = jest.fn()

jest.mock("expo-file-system", () => ({ File: mockExpoFile }))
jest.mock("@/utils/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: "user-1" } } },
      }),
    },
    storage: {
      from: jest.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  },
}))

describe("uploadBookCover", () => {
  it("uploads the browser File directly instead of using Expo FileSystem", async () => {
    jest.replaceProperty(Platform, "OS", "web")
    const browserFile = new Blob(["cover"], { type: "image/jpeg" }) as File
    const asset = {
      uri: "blob:https://app.test/cover",
      width: 600,
      height: 900,
      type: "image",
      mimeType: "image/jpeg",
      fileName: "cover.jpg",
      file: browserFile,
    } satisfies ImagePickerAsset
    mockUpload.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://cdn.test/cover.jpg" } })

    await expect(uploadBookCover(asset)).resolves.toBe("https://cdn.test/cover.jpg")
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^user-1\/\d+\.jpg$/),
      browserFile,
      expect.objectContaining({ contentType: "image/jpeg" }),
    )
    expect(mockExpoFile).not.toHaveBeenCalled()
  })
})
