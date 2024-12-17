"use client";

import { Separator } from "@/components/ui/separator";
import { usePathname, useRouter } from "next/navigation";

export default function SettingsLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  
  return (
    <div className="container mx-auto py-6">
      
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage Nyaatify settings and preferences</p>
      </div>

      <Separator className="mb-6" />

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-1/4 pr-6">
          <nav className="space-y-2">
            <button
              className={`w-full text-left px-4 py-2 rounded-lg ${
                pathname === "/settings/rss" ? "bg-secondary" : ""
              }`}
              onClick={() => router.push("/settings/rss")}
            >
              RSS Settings
            </button>

            <button
              className={`w-full text-left px-4 py-2 rounded-lg ${
                pathname === "/settings/about" ? "bg-secondary" : ""
              }`}
              onClick={() => router.push("/settings/about")}
            >
              About
            </button>
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