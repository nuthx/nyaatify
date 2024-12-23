import "./globals.css";
import { AR_One_Sans } from 'next/font/google'

import { I18nWrapper } from "@/app/i18n/wrapper";
import { log } from "@/lib/log";
import { rssSchedule } from "@/lib/schedule";
import { NavBar } from "@/components/navbar";

// Use Google Fonts
const arOneSans = AR_One_Sans({ 
  subsets: ['latin'],
  display: 'swap',
  fallback: ['-apple-system', 'system-ui', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft Yahei', 'Arial', 'sans-serif']
})

// Start RSS subscription task (only in production)
if (process.env.NODE_ENV === "production") {
  rssSchedule().catch(log.error);
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={arOneSans.className}>
      <body className="bg-zinc-50">
        <I18nWrapper>
          <NavBar />
          {children}
        </I18nWrapper>
      </body>
    </html>
  );
}
