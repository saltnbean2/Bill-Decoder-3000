import type { MetadataRoute } from "next";

/** Lets people add Doc Deco to their home screen and open it full-screen, like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Doc Deco",
    short_name: "Doc Deco",
    description: "Any paperwork. Explained in your language.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F5",
    theme_color: "#FAF8F5",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
