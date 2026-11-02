import type { ReactNode } from "react"

process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.invalid"
process.env.EXPO_PUBLIC_SUPABASE_KEY = "test-anon-key"
process.env.EXPO_PUBLIC_API_URL = "https://api.test"

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
)

jest.mock("expo-router", () => {
  const React = require("react")
  const MockStack = ({ children }: { children?: ReactNode }) => children ?? null
  MockStack.Screen = ({ options }: { options?: { headerRight?: () => ReactNode } }) =>
    options?.headerRight ? options.headerRight() : null

  return {
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
    Redirect: ({ href }: { href: string }) =>
      React.createElement(require("react-native").Text, null, `Redirect:${href}`),
    Slot: () => null,
    Stack: MockStack,
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
    useFocusEffect: (callback: () => void | (() => void)) =>
      jest.requireActual("react").useEffect(callback, [callback]),
    useLocalSearchParams: jest.fn(() => ({})),
  }
})

jest.mock("expo-linking", () => ({
  createURL: jest.fn((path: string) => `commonshelf://${path.replace(/^\//, "")}`),
  getInitialURL: jest.fn().mockResolvedValue(null),
  useURL: jest.fn(() => null),
}))

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}))

beforeEach(() => {
  jest.clearAllMocks()
})
