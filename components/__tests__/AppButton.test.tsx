import { fireEvent, render, screen } from "@testing-library/react-native"

import AppButton from "../AppButton"

describe("AppButton", () => {
  it("has an accessible name and invokes its action", () => {
    const onPress = jest.fn()
    render(<AppButton title="Save Book" onPress={onPress} />)
    fireEvent.press(screen.getByRole("button", { name: "Save Book" }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it("announces and blocks interaction while loading", () => {
    const onPress = jest.fn()
    render(<AppButton title="Save Book" loading onPress={onPress} />)
    const button = screen.getByRole("button", { name: "Loading..." })
    expect(button).toBeDisabled()
    expect(button.props.accessibilityState).toEqual({ busy: true, disabled: true })
    fireEvent.press(button)
    expect(onPress).not.toHaveBeenCalled()
  })
})
