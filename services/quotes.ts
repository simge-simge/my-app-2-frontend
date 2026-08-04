type QuoteRecord = {
  quote: string
  author: string
}

const quoteRecords = require("../assets/texts/quotes.json") as QuoteRecord[]
const homeDisplayImages = [
  require("../assets/images/home_display/0.jpg"),
  require("../assets/images/home_display/1.jpg"),
  require("../assets/images/home_display/2.jpg"),
  require("../assets/images/home_display/3.jpg"),
  require("../assets/images/home_display/4.jpg"),
  require("../assets/images/home_display/5.jpg"),
  require("../assets/images/home_display/6.jpg"),
  require("../assets/images/home_display/7.jpg"),
  require("../assets/images/home_display/8.jpg"),
  require("../assets/images/home_display/9.jpg"),
] as const

export type Quote = {
  quote: string
  author: string
}

export function getRandomQuote(): Quote {
  const validQuotes = quoteRecords.filter(
    (item) => typeof item.quote === "string" && item.quote.trim() && typeof item.author === "string" && item.author.trim()
  )

  if (validQuotes.length === 0) {
    return {
      quote: "A good story can still surprise you when you open the page again.",
      author: "CommonShelf",
    }
  }

  const randomIndex = Math.floor(Math.random() * validQuotes.length)
  const selectedQuote = validQuotes[randomIndex]

  return {
    quote: selectedQuote.quote.trim(),
    author: selectedQuote.author.trim(),
  }
}

export function getRandomHomeDisplayImage() {
  const randomIndex = Math.floor(Math.random() * homeDisplayImages.length)
  return homeDisplayImages[randomIndex]
}
