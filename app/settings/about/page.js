"use client";

import { Separator } from "@/components/ui/separator";

export default function AboutSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">About</h3>
        <p className="text-sm text-muted-foreground">
          Current application version details
        </p>
      </div>
      <Separator />
      <div className="text-sm">
        <p>Version: 0.0.1</p>
      </div>
    </div>
  );
} 