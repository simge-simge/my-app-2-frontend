import type { ImagePickerAsset } from "expo-image-picker"
import { File as ExpoFile } from "expo-file-system"
import { Platform } from "react-native"
import { supabase } from "@/utils/supabase"

function getFileExtension(asset: ImagePickerAsset) {
  if (asset.fileName?.includes(".")) {
    return asset.fileName.split(".").pop()?.toLowerCase() || "jpg"
  }

  if (asset.mimeType?.includes("/")) {
    return asset.mimeType.split("/").pop()?.toLowerCase() || "jpg"
  }

  return "jpg"
}

function buildImagePath(asset: ImagePickerAsset) {
  const sessionId = supabase.auth.getSession()

  return sessionId.then(({ data }) => {
    const userId = data.session?.user.id
    if (!userId) throw new Error("Please sign in to upload an image.")
    const extension = getFileExtension(asset)
    return `${userId}/${Date.now()}.${extension}`
  })
}

export async function uploadImage(asset: ImagePickerAsset, bucket: "book_covers" | "profile_pictures") {
  let fileBody: File | Blob | Uint8Array

  if (Platform.OS === "web") {
    if (asset.file) {
      fileBody = asset.file
    } else {
      const response = await fetch(asset.uri)
      if (!response.ok) throw new Error("Could not read that image.")
      fileBody = await response.blob()
    }
  } else {
    fileBody = await new ExpoFile(asset.uri).bytes()
  }
  const filePath = await buildImagePath(asset)

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBody, {
      contentType: asset.mimeType ?? "image/jpeg",
      upsert: false,
    })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}
