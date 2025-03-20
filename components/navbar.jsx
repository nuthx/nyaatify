"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react"

export function NavBar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-sm">
      <nav className="container mx-auto max-w-screen-xl flex h-[60px] items-center justify-between">
        <Link href="/" className="flex items-center gap-4">
          <Image src="/images/logo.svg" alt="Nyaatify Logo" className="dark:invert" width={40} height={40} priority />
          <span className="text-xl font-bold">Nyaatify</span>
        </Link>

        <div className="flex items-center gap-3">
          <NavLink href="/anime" />
          <NavLink href="/downloads" />
          <NavLink href="/settings" />

          {pathname !== "/login" && (
            <button onClick={handleLogout} className="px-4 py-1.5 text-sm text-primary/80 rounded-md transition-all duration-300 ease-in-out hover:bg-accent">
              {t("glb.logout")}
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href }) {
  const { t } = useTranslation();

  return (
    <Link href={href} className="px-4 py-1.5 text-sm text-primary/80 rounded-md transition-all duration-300 ease-in-out hover:bg-accent">
      {t(`nav.${href.replace("/", "")}`)}
    </Link>
  );
}
