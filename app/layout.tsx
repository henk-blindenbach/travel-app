import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { NavigationProgress } from "../components/NavigationProgress";
import { getLocale, LOCALE_HTML } from "../lib/i18n";
import "./globals.css";
import "./inline-day-detail.css";

export const metadata: Metadata = {
  title: "Nós ✈️",
  description: "Onze reizen, verhalen en foto’s.",
  applicationName: "Nós ✈️",
  appleWebApp: { capable: true, title: "Nós ✈️", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#17355c" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={LOCALE_HTML[locale]}>
      <body>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
