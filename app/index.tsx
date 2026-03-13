import { Text, View, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📚 Book Tinder</Text>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/signup")}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#4A6CF7",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
});