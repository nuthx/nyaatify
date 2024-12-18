"use client";

import { Nav } from "@/components/settings/nav";

export default function SettingsLayout({ children }) {
  return (
    <div className="container flex mx-auto py-6">
        <nav className="w-80 pr-8 space-y-2">
          <Nav label="General" path="/settings/general" />
          <Nav label="RSS Subscription" path="/settings/rss" />
          <Nav label="Download Server" path="/settings/server" />
          <Nav label="Notification" path="/settings/notification" />
          <Nav label="User" path="/settings/user" />
          <Nav label="About" path="/settings/about" />
        </nav>

        <div className="flex-1">
          {children}
        </div>
    </div>
  );
}
