import type { Metadata } from "next";
import { Limelight, Jost } from "next/font/google";
import "./globals.css";

// Limelight for signage only (deco marquee caps), Jost for everything else —
// a geometric sans in the Futura family the period actually used.
const limelight = Limelight({
  variable: "--font-limelight",
  weight: "400",
  subsets: ["latin"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Whisker Jack — a cat's blackjack club",
  description: "Multiplayer blackjack, dealt to cats. Pick a table, place your chips, stand pat.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${limelight.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink text-cream">{children}</body>
    </html>
  );
}
