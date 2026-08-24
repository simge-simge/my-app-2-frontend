const { withAndroidColors, withAndroidColorsNight } = require("@expo/config-plugins")

const light = {
  background: "#FFF9ED", paper: "#FFFCF5", surface: "#FFFCF5", surface_muted: "#F7EEDC", surface_strong: "#38332D",
  border: "#D8CCBA", border_strong: "#62584D", text: "#38332D", text_muted: "#706458", text_soft: "#7A633E",
  accent: "#4F6F32", accent_dark: "#365020", accent_soft: "#E7EDC8", orange: "#E78A33", orange_soft: "#F8DFC0",
  yellow: "#F6D895", green: "#B9CE6B", blue: "#91CBD7", blue_soft: "#DDEFF2", rose: "#E9B8A5", rose_soft: "#F7E4DC",
  success: "#3F6B38", success_soft: "#E5EED9", danger: "#A54838", danger_soft: "#F7DED6", white: "#FFFCF5", ink: "#38332D",
}

const dark = {
  background: "#171A16", paper: "#222720", surface: "#222720", surface_muted: "#2C3329", surface_strong: "#F3EBDD",
  border: "#465041", border_strong: "#7E8B75", text: "#F3EBDD", text_muted: "#B9B2A6", text_soft: "#C6A86E",
  accent: "#8FAE69", accent_dark: "#C4DC9A", accent_soft: "#34442A", orange: "#F0A45B", orange_soft: "#4B3423",
  yellow: "#DDBB68", green: "#91B45E", blue: "#68AAB8", blue_soft: "#253B40", rose: "#D6927C", rose_soft: "#472F2B",
  success: "#78B66F", success_soft: "#29402A", danger: "#E18872", danger_soft: "#4B2A25", white: "#F8F4EB", ink: "#F3EBDD",
}

function addColors(modResults, colors) {
  const entries = Object.entries(colors).map(([name, value]) => ({ $: { name: `cs_${name}` }, _: value }))
  const names = new Set(entries.map((entry) => entry.$.name))
  modResults.resources.color = (modResults.resources.color || []).filter((entry) => !names.has(entry.$?.name))
  modResults.resources.color.push(...entries)
  return modResults
}

module.exports = function withThemeColors(config) {
  config = withAndroidColors(config, (androidConfig) => {
    androidConfig.modResults = addColors(androidConfig.modResults, light)
    return androidConfig
  })
  return withAndroidColorsNight(config, (androidConfig) => {
    androidConfig.modResults = addColors(androidConfig.modResults, dark)
    return androidConfig
  })
}
