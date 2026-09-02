import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Save & Recall",
    short_name: "Recall",
    description: "A private place for everything worth remembering.",
    start_url: "/",
    display: "standalone",
    background_color: "#121713",
    theme_color: "#121713",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
