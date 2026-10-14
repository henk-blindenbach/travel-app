import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nós ✈️",
    short_name: "Nós ✈️",
    description: "Onze reizen, verhalen en foto’s.",
    start_url: "/app/today",
    display: "standalone",
    background_color: "#f7f9fa",
    theme_color: "#17355c",
    icons: [{ src: "/icon.png", sizes: "1254x1254", type: "image/png", purpose: "any" }],
  };
}
