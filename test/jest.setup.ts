import type { ReactNode } from "react"

process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.invalid"
process.env.EXPO_PUBLIC_SUPABASE_KEY = "test-anon-key"
process.env.EXPO_PUBLIC_API_URL = "https://api.test"

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useFocusEffect: (callback: () => void | (() => void)) =>
    jest.requireActual("react").useEffect(callback, [callback]),
  useLocalSearchParams: jest.fn(() => ({})),
}))

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}))

beforeEach(() => {
  jest.clearAllMocks()
})
