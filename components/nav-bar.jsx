import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function NavBar() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto max-w-screen-xl flex h-16 items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="font-bold text-xl mr-4">Nyaaitfy</Link>
          <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">Home</Link>
          <Link href="/server" className="text-sm font-medium transition-colors hover:text-primary">Server</Link>
          <Link href="/settings" className="text-sm font-medium transition-colors hover:text-primary">Settings</Link>
        </div>

        <Avatar className="h-10 w-10">
          <AvatarImage src="" alt="User" />
          <AvatarFallback></AvatarFallback>
        </Avatar>
      </div>
    </nav>
  );
}
