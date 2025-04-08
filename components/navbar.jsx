"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePathname, useRouter } from "next/navigation";
import { API } from "@/lib/http/api";
import { handleRequest } from "@/lib/http/request";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    const result = await handleRequest("DELETE", API.LOGOUT, null, t("toast.failed.logout"));
    if (result) {
      router.push("/login");
      router.refresh();
    }
  };

  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-sm">
      <nav className="container mx-auto max-w-screen-xl flex h-16 items-center justify-between px-6 md:px-10">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/images/logo-round.svg" alt="Nyaatify Logo" className="dark:invert" width={40} height={40} priority draggable="false"/>
          <span className="text-xl font-bold">Nyaatify</span>
        </Link>

        <Button variant="outline" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </Button>

        <div 
          className={`
            ${isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"} 
            md:opacity-100 md:pointer-events-auto
            absolute md:relative top-16 md:top-0 left-0 right-0
            flex flex-col md:flex-row items-center gap-3
            bg-background p-4 md:p-0 border-y md:border-0 shadow-sm md:shadow-none
          `}
        >
          <NavLink href="/anime" />
          <NavLink href="/downloads" />
          <NavLink href="/settings" />
          <button onClick={handleLogout} className="w-full md:w-auto px-4 py-3 md:py-1.5 text-sm text-center text-primary/80 rounded-md transition-all duration-300 ease-in-out hover:bg-accent">
            {t("glb.logout")}
          </button>
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href }) {
  const { t } = useTranslation();

  return (
    <Link href={href} className="w-full md:w-auto px-4 py-3 md:py-1.5 text-sm text-center text-primary/80 rounded-md transition-all duration-300 ease-in-out hover:bg-accent">
      {t(`nav.${href.replace("/", "")}`)}
    </Link>
  );
}
