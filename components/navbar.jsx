"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/icons/logo";

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto max-w-screen-xl flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="text-lg font-semibold">Nyaatify</span>
        </Link>

        <div className="flex items-center space-x-8">
          <Link href="/" className={`text-sm transition-all hover:text-primary ${pathname === '/' ? 'text-primary' : 'text-gray-500'}`}>
            Home
          </Link>
          <Link href="/server" className={`text-sm transition-all hover:text-primary ${pathname === '/server' ? 'text-primary' : 'text-gray-500'}`}>
            Server
          </Link>
          <Link href="/settings" className={`text-sm text-sm transition-all hover:text-primary ${pathname === '/settings' ? 'text-primary' : 'text-gray-500'}`}>
            Settings
          </Link>
          <Link href="/logout" className={`text-sm text-sm transition-all hover:text-primary ${pathname === '/logout' ? 'text-primary' : 'text-gray-500'}`}>
            Logout
          </Link>
        </div>
      </div>
    </nav>
  );
}
