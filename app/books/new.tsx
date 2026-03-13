import { useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { router } from "expo-router"

import AppButton from "@/components/AppButton"
import { createBook } from "@/services/books"

export default function NewBookScreen() {
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [description, setDescription] = useState("")
  const [isbn, setIsbn] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      Alert.alert("Missing title", "Please enter a title for the book.")
      return
    }

    try {
      setSaving(true)

      await createBook({
        title: trimmedTitle,
        author: author.trim() || null,
        description: description.trim() || null,
        isbn: isbn.trim() || null,
      })

      router.replace("/library")
    } catch (err) {
      console.error("Failed to create book", err)
      Alert.alert("Error", "Could not save the book.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Add Book</Text>
        <Text style={styles.subtitle}>Enter the details for the book you want in your library</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Book title"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Author</Text>
          <TextInput
            style={styles.input}
            value={author}
            onChangeText={setAuthor}
            placeholder="Author name"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>ISBN</Text>
          <TextInput
            style={styles.input}
            value={isbn}
            onChangeText={setIsbn}
            placeholder="ISBN"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Short description"
            multiline
            textAlignVertical="top"
          />
        </View>

        <AppButton title="Save Book" onPress={handleSave} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#F7F8FC",
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 24,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    fontSize: 15,
  },
  descriptionInput: {
    minHeight: 120,
  },
})
