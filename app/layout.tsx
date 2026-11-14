import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Armenian, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
// Armenian and Korean are only loaded when those glyphs appear (no preload).
const armenian = Noto_Sans_Armenian({
  variable: "--font-armenian",
  subsets: ["armenian"],
  display: "swap",
  preload: false,
});
const korean = Noto_Sans_KR({
  variable: "--font-korean",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Explain It — any paperwork, explained in your language",
  description:
    "Take a photo of a parking ticket, official letter or contractor quote. Get a plain-language explanation, the deadline and exactly what to do — in English, Armenian, Spanish, Korean or Tagalog.",
  appleWebApp: { capable: true, title: "Explain It", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Android: the keyboard shrinks the layout, like iOS, so inputs near the bottom stay visible.
  interactiveWidget: "resizes-content",
  themeColor: "#FAF8F5",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${armenian.variable} ${korean.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
