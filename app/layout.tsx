import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Op reis — onze reizen",
  description: "Plaatsen, verhalen en foto's die bijblijven."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="nl"><body>{children}</body></html>;
}
