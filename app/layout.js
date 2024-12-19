import "./globals.css";

import { I18nWrapper } from "@/app/i18n/wrapper";
import { log } from "@/lib/log";
import { rssSchedule } from "@/lib/schedule";
import { NavBar } from "@/components/nav-bar";

// Start RSS subscription task
// Only start in production
if (process.env.NODE_ENV === "production") {
  rssSchedule().catch(log.error);
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-zinc-50">
        <NavBar />
        <I18nWrapper>{children}</I18nWrapper>
      </body>
    </html>
  );
}
