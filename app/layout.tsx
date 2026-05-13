import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Plus_Jakarta_Sans } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StickyActions } from "@/components/StickyActions";
import { WhatsAppChat } from "@/components/WhatsAppChat";
import { site } from "@/lib/site";
import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

const displayFont = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(site.baseUrl),
  applicationName: site.name,
  title: {
    default: "Grade A Plumbing Melbourne | Local Plumber Melbourne VIC",
    template: "%s"
  },
  description: site.description,
  icons: {
    icon: "/favicon.svg"
  },
  openGraph: {
    siteName: site.name,
    locale: "en_AU",
    type: "website"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0758d6"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU">
      <body className={`${bodyFont.variable} ${displayFont.variable} font-sans antialiased`}>
        <Header />
        <main className="pb-16 md:pb-0">{children}</main>
        <Footer />
        <WhatsAppChat />
        <StickyActions />
      </body>
    </html>
  );
}
