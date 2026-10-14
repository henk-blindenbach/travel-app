import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./inline-day-detail.css";

export const metadata: Metadata = {
  title: "Nós ✈️",
  description: "Onze reizen, verhalen en foto’s.",
  applicationName: "Nós ✈️",
  appleWebApp: { capable: true, title: "Nós ✈️", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#17355c" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="nl"><body>{children}</body></html>;
}
