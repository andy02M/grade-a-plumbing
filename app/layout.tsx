import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { site } from "@/lib/site";
import { StickyActions } from "@/components/StickyActions";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.baseUrl),
  applicationName: site.name,
  title: {
    default: "Grade A Plumbing | Local Plumbing Services",
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
      <body className="font-sans antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
        <StickyActions />
      </body>
    </html>
  );
}


