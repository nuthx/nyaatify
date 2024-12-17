"use client";

import { usePathname, useRouter } from "next/navigation";

export function Nav({ label, path }) {
  const router = useRouter();
  const pathname = usePathname();
  
  return (
    <button
      className={`w-full text-left px-4 py-2 rounded-lg hover:bg-secondary/80 ${pathname === path ? "bg-secondary" : ""}`}
      onClick={() => router.push(path)}
    >
      {label}
    </button>
  );
}
