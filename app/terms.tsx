import LegalDocument, { type LegalSection } from "@/components/LegalDocument"

const sections: LegalSection[] = [
  {
    title: "1. Agreement",
    paragraphs: [
      "These Terms of Service govern your use of the CommonShelf mobile and web application. CommonShelf is operated by an independent developer. By creating an account or using the service, you agree to these terms and the Privacy Policy. If you do not agree, do not use CommonShelf.",
      "You may use CommonShelf only if you can legally agree to these terms. Where applicable law requires permission from a parent or guardian, you may use the service only with that permission and supervision. CommonShelf does not impose a separate fixed minimum age through these terms.",
    ],
  },
  {
    title: "2. What CommonShelf provides",
    paragraphs: [
      "CommonShelf helps readers list books, discover books and readers, join communities, express interest in books, create matches, and coordinate lending or sharing. Features may change, be suspended, or be discontinued as the service develops.",
      "CommonShelf provides the platform only. It does not own users' books, act as a party to lending or exchange arrangements, guarantee that a listing is accurate, or supervise in-person meetings between users.",
    ],
  },
  {
    title: "3. Accounts and security",
    bullets: [
      "Provide accurate account information and keep it reasonably current.",
      "Keep your password and devices secure. You are responsible for activity performed through your account unless applicable law provides otherwise.",
      "Notify CommonShelf promptly if you believe your account has been accessed without permission.",
      "Do not create accounts through automated means, impersonate another person, or transfer an account without permission.",
    ],
  },
  {
    title: "4. Your content",
    paragraphs: [
      "You retain ownership of content you submit, including profile information, book descriptions, and images. You grant CommonShelf a non-exclusive, worldwide, royalty-free license to host, store, reproduce, process, resize, display, and distribute that content only as needed to operate, secure, and improve the service. This license ends when the content is deleted, except for reasonable technical delays, backups, legal obligations, and content that another user independently retains through a service interaction.",
      "You are responsible for your content. You must have the rights needed to upload it, and it must not violate copyright, privacy, publicity, or other rights. Book metadata and cover images supplied by third-party catalogs remain subject to their respective rights and terms.",
    ],
  },
  {
    title: "5. Acceptable use",
    bullets: [
      "Do not harass, threaten, deceive, discriminate against, exploit, or endanger another person.",
      "Do not post illegal, infringing, sexually exploitative, hateful, malicious, or intentionally misleading content.",
      "Do not scrape the service, probe or bypass security, introduce malware, overload infrastructure, reverse engineer protected parts of the service, or use automated systems without written permission.",
      "Do not use another member's contact information for spam, advertising, surveillance, or any purpose unrelated to the book-sharing interaction for which it was revealed.",
      "Do not sell access to an account or use CommonShelf for unauthorized commercial activity.",
    ],
  },
  {
    title: "6. Lending, exchanges, and personal safety",
    paragraphs: [
      "You decide whether, where, and how to meet or exchange a book. Exercise judgment, communicate clearly about the book's condition and return expectations, meet in a safe public place when appropriate, and do not share more personal information than necessary.",
      "CommonShelf is not responsible for loss, damage, non-return of books, user conduct, transportation, meetings, or private arrangements between users. Report serious misuse to the contact address below and contact local authorities if anyone is in immediate danger.",
    ],
  },
  {
    title: "7. Communities and moderation",
    paragraphs: [
      "Community membership may require approval. Community administrators can review membership requests and manage their communities. CommonShelf may investigate reports and may remove content, restrict features, suspend accounts, or terminate access when reasonably necessary to enforce these terms, protect users, comply with law, or preserve service integrity. CommonShelf is not required to monitor every listing or interaction.",
    ],
  },
  {
    title: "8. Third-party services",
    paragraphs: [
      "CommonShelf relies on third-party services, including Supabase, Google sign-in, the Google Gemini API, and Open Library. Their services, content, availability, and data practices are controlled by those providers and may be governed by separate terms and privacy notices. CommonShelf is not responsible for third-party services beyond what applicable law requires.",
    ],
  },
  {
    title: "9. CommonShelf intellectual property",
    paragraphs: [
      "The CommonShelf name, application design, software, and original materials are protected by applicable intellectual-property laws. These terms give you a limited, personal, revocable, non-exclusive, non-transferable right to use the service for its intended purpose. They do not transfer ownership of CommonShelf or other users' content to you.",
    ],
  },
  {
    title: "10. Account deletion and termination",
    paragraphs: [
      "You may stop using CommonShelf at any time and can delete your account from Settings by selecting Delete My Profile. CommonShelf may suspend or terminate access for serious or repeated violations, legal risk, security threats, or material harm to the service or other users. Provisions that by their nature should survive termination—including ownership, disclaimers, liability limits, and dispute provisions—will survive.",
    ],
  },
  {
    title: "11. Disclaimers",
    paragraphs: [
      "To the fullest extent permitted by law, CommonShelf is provided on an “as is” and “as available” basis. No promise is made that the service will always be available, secure, error-free, or accurate, or that users, listings, scans, catalog results, matches, or lending arrangements will meet your expectations. Nothing in these terms excludes warranties or consumer rights that cannot legally be excluded.",
    ],
  },
  {
    title: "12. Limitation of liability",
    paragraphs: [
      "To the fullest extent permitted by law, the operator of CommonShelf will not be liable for indirect, incidental, special, consequential, or punitive losses, loss of data or opportunity, or harm arising from user conduct, book transactions, third-party services, or unauthorized access beyond the operator's reasonable control. Any liability that cannot legally be excluded remains limited only to the extent the law permits. Mandatory consumer rights are unaffected.",
    ],
  },
  {
    title: "13. Applicable law and disputes",
    paragraphs: [
      "These terms are governed by the laws applicable to the independent operator of CommonShelf, without depriving you of mandatory protections available under the law where you live. Before starting formal proceedings, please contact CommonShelf and allow a reasonable opportunity to resolve the issue informally, unless urgent action or applicable law permits otherwise.",
    ],
  },
  {
    title: "14. Changes",
    paragraphs: [
      "These terms may be updated as the service changes. The updated date will appear above. Reasonable notice will be provided before material changes take effect when required. Continuing to use CommonShelf after an updated version takes effect means you accept it, except where applicable law requires separate consent.",
    ],
  },
]

export default function TermsOfService() {
  return (
    <LegalDocument
      title="Terms of Service"
      summary="These terms set the ground rules for using CommonShelf and for treating books, communities, and fellow readers with care."
      sections={sections}
      relatedLabel="Privacy Policy"
      relatedRoute="/privacy"
    />
  )
}
