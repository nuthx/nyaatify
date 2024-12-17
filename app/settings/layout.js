"use client";

import { Separator } from "@/components/ui/separator";
import { Nav } from "@/components/settings/nav";

export default function SettingsLayout({ children }) {
  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="my-6">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage Nyaatify settings and preferences</p>
      </div>

      <Separator className="mb-6" />

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-72 pr-6">
          <nav className="space-y-2">
            <Nav label="General" path="/settings/general" />
            <Nav label="RSS Subscription" path="/settings/rss" />
            <Nav label="Download Server" path="/settings/server" />
            <Nav label="Notification" path="/settings/notification" />
            <Nav label="User" path="/settings/user" />
            <Nav label="About" path="/settings/about" />
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
} 