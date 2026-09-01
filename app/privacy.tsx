import LegalDocument, { type LegalSection } from "@/components/LegalDocument"

const sections: LegalSection[] = [
  {
    title: "1. Who operates CommonShelf",
    paragraphs: [
      "CommonShelf is a community book-sharing application operated by an independent developer. This policy explains how CommonShelf collects, uses, discloses, and protects information when you use the mobile or web application.",
    ],
  },
  {
    title: "2. Information we collect",
    bullets: [
      "Account and authentication information: your email address, account identifier, authentication status, and related security information. If you use Google sign-in, CommonShelf receives the basic profile information Google makes available for authentication, such as your email address, name, and profile image. CommonShelf never receives your Google password.",
      "Profile information: your display name, profile image, selected location, community membership, and optional contact details such as phone number, Instagram username, or Telegram username.",
      "Books and activity: books and cover images you add, titles, authors, ISBNs, descriptions, availability, searches, swipe choices, matches, borrowing requests, community requests, notifications, and the actions needed to operate those features.",
      "Camera and photos: CommonShelf requests camera or photo-library access only when you choose a feature that needs it. Book-cover images you upload are stored and may be publicly accessible with the related book listing.",
      "Shelf scans: when you choose to scan a shelf, the selected image is sent through CommonShelf's server to Google's Gemini API to identify visible books. CommonShelf processes the image in memory and does not store the shelf photo. It stores the scan status and detected book suggestions so you can review them. Books are added to your library only after you confirm them.",
      "Technical information: the application and its hosting providers may process device, browser, IP address, request, diagnostic, and security-log information needed to deliver and protect the service. The application also stores session and preference information on your device, including language and theme choices.",
    ],
  },
  {
    title: "3. How we use information",
    bullets: [
      "Create and secure your account, authenticate you, and provide customer support.",
      "Show your shelf, help you find books and readers, manage communities, create matches and borrowing requests, and reveal contact information when the relevant sharing action is taken.",
      "Process book covers and shelf scans, retrieve book metadata, maintain notifications, and remember your preferences.",
      "Prevent abuse, investigate errors, protect users and the service, comply with legal obligations, and improve reliability and functionality.",
    ],
  },
  {
    title: "4. Google user data",
    paragraphs: [
      "Google sign-in is used only to authenticate you and create or access your CommonShelf account. CommonShelf requests basic identity scopes and uses the resulting email address, name, profile image, and account identifier only for sign-in, account management, security, and user-facing profile features described in this policy.",
      "CommonShelf does not sell Google user data, use it for advertising, transfer it to data brokers, or use it to determine creditworthiness. It is shared only with service providers needed to operate authentication and the service, when you direct a sharing feature, or when legally required. CommonShelf's use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including its Limited Use requirements where applicable.",
    ],
  },
  {
    title: "5. When information is shared",
    bullets: [
      "With other users: your display name, profile image, community, and book listings may be visible to eligible CommonShelf users. Optional contact details are shared through match and borrowing features when the application's contact-reveal rules allow it. Do not add information you do not want shared in this way.",
      "With Supabase: CommonShelf uses Supabase for authentication, database services, and file storage.",
      "With Google: Google provides OAuth sign-in. A shelf photo is sent to the Google Gemini API only when you start a shelf scan.",
      "With Open Library: CommonShelf may send an ISBN, book title, author, and language to retrieve or match public book-catalog information.",
      "For safety or legal reasons: information may be disclosed when reasonably necessary to comply with law, respond to lawful requests, enforce these terms, investigate abuse, or protect rights and safety.",
      "In a service transfer: information may be transferred if CommonShelf is reorganized, transferred, or continued by another operator, subject to this policy and applicable law.",
    ],
  },
  {
    title: "6. Storage, security, and international processing",
    paragraphs: [
      "CommonShelf uses reasonable administrative and technical safeguards, including authenticated access and provider security controls. No online system can be guaranteed completely secure.",
      "Service providers may process information in countries other than yours. Their processing is governed by their own terms, privacy notices, and applicable data-protection safeguards.",
    ],
  },
  {
    title: "7. Retention and deletion",
    paragraphs: [
      "Information is kept while your account is active and as reasonably needed to provide and secure CommonShelf. Shelf photos are not stored by CommonShelf; scan results remain associated with your account until removed or your account is deleted. Operational logs, backups, and records needed for security, dispute resolution, or legal compliance may remain for a limited period.",
      "You can delete your account in Settings by selecting Delete My Profile. This deletes your CommonShelf authentication account and profile-associated application records. You may also email the address below to request access, correction, export, restriction, objection, or deletion where applicable. Some information may be retained when required by law, necessary to protect the service, or present in temporary backups.",
    ],
  },
  {
    title: "8. Your choices",
    bullets: [
      "You can edit optional profile and contact information in Settings, leave optional fields blank, and control camera or photo access in your device settings.",
      "You may use email and password instead of Google sign-in. You can also revoke CommonShelf's Google access from your Google Account settings, though this does not by itself delete your CommonShelf account.",
      "You can remove books and matches through available application controls and delete your entire account from Settings.",
    ],
  },
  {
    title: "9. Children",
    paragraphs: [
      "CommonShelf is a general-audience service and is not designed specifically for children. If you believe a child has provided personal information without the authorization required by applicable law, contact CommonShelf so the situation can be reviewed and appropriate action taken.",
    ],
  },
  {
    title: "10. Changes to this policy",
    paragraphs: [
      "This policy may be updated as CommonShelf changes or legal requirements evolve. The updated date will be shown above. If a material change affects how previously collected information is used, reasonable notice or consent will be provided when required.",
    ],
  },
]

export default function PrivacyPolicy() {
  return (
    <LegalDocument
      title="Privacy Policy"
      summary="Your shelf should bring people together without making your personal information a mystery. This policy describes what CommonShelf handles, why it is needed, and the choices available to you."
      sections={sections}
      relatedLabel="Terms of Service"
      relatedRoute="/terms"
    />
  )
}
