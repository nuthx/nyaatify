import "./globals.css";
import { NavBar } from "@/components/nav-bar";
import { rssSchedule } from "@/lib/schedule";
import { log } from "@/lib/log";

// Start RSS auto update task
// Only start in production
if (process.env.NODE_ENV === "production") {
  rssSchedule().catch(log.error);
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
