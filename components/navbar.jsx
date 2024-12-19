"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto max-w-screen-xl flex h-16 items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="font-bold text-xl">Nyaaitfy</Link>
          <Separator orientation="vertical" className="h-6" />
          <Link href="/" className={`transition-colors ${pathname === '/' ? 'text-primary font-medium' : 'text-gray-500'} hover:text-primary`}>Home</Link>
          <Link href="/server" className={`transition-colors ${pathname === '/server' ? 'text-primary font-medium' : 'text-gray-500'} hover:text-primary`}>Server</Link>
          <Link href="/settings" className={`transition-colors ${pathname === '/settings' ? 'text-primary font-medium' : 'text-gray-500'} hover:text-primary`}>Settings</Link>
        </div>

        <Avatar className="h-10 w-10">
          <AvatarImage src="" alt="User" />
          <AvatarFallback></AvatarFallback>
        </Avatar>
      </div>
    </nav>
  );
}
