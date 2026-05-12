// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://imr.in"
  ),
  title: {
    default: "IMR — India Movie Reviews | AI-Powered Ratings",
    template: "%s | IMR India Movie Reviews",
  },
  description:
    "India's first AI-powered movie review platform. Real-time ratings based on public sentiment analysis for Hindi, Telugu, Tamil, Malayalam and Kannada films.",
  keywords: [
    "Indian movie reviews", "Bollywood reviews", "Telugu movies",
    "Tamil movies", "Malayalam movies", "AI movie ratings", "IMR",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "IMR — India Movie Reviews",
  },
  twitter: {
    card: "summary_large_image",
    site: "@imr_movies",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Poppins:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}