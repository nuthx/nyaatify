import "./globals.css";
import { AR_One_Sans } from "next/font/google"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { I18nWrapper } from "@/i18n/wrapper";
import { log } from "@/lib/log";
import { rssSchedule } from "@/lib/schedule";
import { Toaster } from "@/components/ui/toaster"
import { NavBar } from "@/components/navbar";

// Use Google Fonts
const arOneSans = AR_One_Sans({ 
  subsets: ["latin"],
  display: "swap",
  fallback: ["-apple-system", "system-ui", "PingFang SC", "Hiragino Sans GB", "Microsoft Yahei", "Arial", "sans-serif"]
})

// Start RSS subscription task (only in production)
if (process.env.NODE_ENV === "production") {
  rssSchedule().catch(log.error);
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={arOneSans.className} suppressHydrationWarning>
      <body className="bg-zinc-50">
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nWrapper>
            <NavBar />
            {children}
            <Toaster />
          </I18nWrapper>
        </NextThemesProvider>
      </body>
    </html>
  );
}
