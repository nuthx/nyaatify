import { NavBar } from "@/components/nav-bar";
import "./globals.css";
import { initRss } from "@/lib/rssManager";

// Initialize RSS auto update task
initRss().catch(console.error);

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
