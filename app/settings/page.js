"use client";

import { Separator } from "@/components/ui/separator";
import { Title } from "@/components/settings/title";

export default function Settings() {
  return (
    <div className="space-y-6">
      <Title 
        title="General"
        description="Nyaatify general settings"
      />
      <Separator />
      <div className="text-sm">
        <p>Version: 0.0.1</p>
      </div>
    </div>
  )
}
