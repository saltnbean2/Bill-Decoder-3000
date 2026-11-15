import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, Noto_Sans_Armenian, Noto_Sans_KR, Noto_Serif_Armenian } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
// Armenian and Korean are only loaded when those glyphs appear (no preload).
const armenian = Noto_Sans_Armenian({
  variable: "--font-armenian",
  subsets: ["armenian"],
  display: "swap",
  preload: false,
});
// Display serif for big headlines; Armenian headlines use a matching Armenian serif.
const display = Instrument_Serif({ variable: "--font-display", subsets: ["latin"], weight: "400", display: "swap" });
const displayHy = Noto_Serif_Armenian({
  variable: "--font-display-hy",
  subsets: ["armenian"],
  weight: ["400", "500"],
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
  themeColor: "#F3F1EC",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${armenian.variable} ${korean.variable} ${display.variable} ${displayHy.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
