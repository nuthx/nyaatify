"use client";

import { usePathname, useRouter } from "next/navigation";

export function Nav({ label, path }) {
  const router = useRouter();
  const pathname = usePathname();
  
  return (
    <button
      className={`w-full text-left px-4 py-2.5 rounded-lg hover:bg-zinc-200/60 ${pathname === path ? "bg-zinc-200/60" : ""}`}
      onClick={() => router.push(path)}
    >
      {label}
    </button>
  );
}
