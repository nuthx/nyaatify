import "./globals.css";
import { AR_One_Sans } from "next/font/google"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { I18nWrapper } from "@/i18n/wrapper";
import { initDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { startAllTasks } from "@/lib/schedule";
import { Toaster } from "@/components/ui/sonner"
import { NavBar } from "@/components/navbar";

// Use Google Fonts
const arOneSans = AR_One_Sans({ 
  subsets: ["latin"],
  display: "swap",
  fallback: ["-apple-system", "system-ui", "PingFang SC", "Hiragino Sans GB", "Microsoft Yahei", "Arial", "sans-serif"]
})

// Start RSS task and init DB when running in production
if (process.env.NODE_ENV === "production") {
  Promise.all([
    initDb(),
    startAllTasks()
  ]).catch(logger.error);
}

// Init DB when running in development
if (process.env.NODE_ENV === "development") {
  initDb().catch(logger.error);
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={arOneSans.className} suppressHydrationWarning>
      <body className="bg-secondary/50 dark:bg-background overflow-y-scroll">
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <I18nWrapper>
            <header className="sticky top-0 z-50">
              <NavBar />
            </header>
            <main className="relative">
              {children}
            </main>
            <Toaster position="top-center" offset={20} />
          </I18nWrapper>
        </NextThemesProvider>
      </body>
    </html>
  );
}
