import { fireEvent, render, screen } from "@testing-library/react-native"
import { Image } from "react-native"

import BookDisplay from "../BookDisplay"
import { book } from "@/test/factories"

describe("BookDisplay", () => {
  it("shows the complete cover and keeps its action beside the status", () => {
    const onActionPress = jest.fn()
    const onPress = jest.fn()
    render(
      <BookDisplay
        actionAccessibilityLabel="Ask to borrow this book"
        actionLabel="Ask to borrow"
        book={book({ cover_url: "https://images.test/cover.jpg" })}
        onActionPress={onActionPress}
        onPress={onPress}
      />,
    )

    expect(screen.UNSAFE_getByType(Image).props.resizeMode).toBe("contain")
    expect(screen.getByText("Available")).toBeVisible()
    fireEvent.press(screen.getAllByRole("button", { name: "Ask to borrow this book" })[0])
    expect(onActionPress).toHaveBeenCalledTimes(1)
    expect(onPress).not.toHaveBeenCalled()
  })
})
