import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.deckforged.com"),
  title: {
    default: "Deck Forged | Free Playing Card Maker & Print-Ready Deck Builder",
    template: "%s | Deck Forged",
  },
  description: "Design custom playing cards in your browser. Build a full deck, add artwork and custom ranks, export print-ready PNG files, or send cards to The Game Crafter.",
  applicationName: "Deck Forged",
  authors: [{ name: "Deck Forged", url: "https://www.deckforged.com" }],
  creator: "Deck Forged",
  publisher: "Deck Forged",
  category: "Design",
  keywords: ["playing card maker", "custom card creator", "deck builder", "print playing cards", "card game design tool", "The Game Crafter card upload", "print ready card template"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Deck Forged",
    title: "Deck Forged | Make a Custom Deck of Playing Cards",
    description: "Customize every card with artwork, ranks, suits, pips, typography, and text. Export print-size PNGs or upload the deck to The Game Crafter.",
    images: [{ url: "/deckforged-mark.png", width: 1024, height: 1024, alt: "Deck Forged playing card and anvil mark" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deck Forged | Free Playing Card Maker",
    description: "Design a custom deck and export files sized for professional card printing.",
    images: ["/deckforged-mark.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  icons: { icon: "/deckforged-mark.png", shortcut: "/deckforged-mark.png", apple: "/deckforged-mark.png" },
  other: { "codex-preview": "development" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#090C02" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
