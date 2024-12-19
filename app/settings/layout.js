"use client";

import { Nav } from "@/components/settings";
import { Separator } from "@/components/ui/separator";

export default function SettingsLayout({ children }) {
  return (
    <>
      <h2 className="container mx-auto max-w-screen-xl flex py-12 text-3xl font-bold">Settings</h2>
      <Separator />
      <div className="container mx-auto max-w-screen-xl flex py-8">
        <nav className="w-80 pr-8 space-y-2">
          <Nav label="General" path="/settings" />
          <Nav label="RSS Subscription" path="/settings/rss" />
          <Nav label="Download Server" path="/settings/server" />
          <Nav label="Notification" path="/settings/notification" />
          <Nav label="User Account" path="/settings/user" />
          <Nav label="About Nyaatify" path="/settings/about" />
        </nav>

        <div className="flex-1 space-y-6">
          {children}
        </div>
      </div>
    </>
  );
}
