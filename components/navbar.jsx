"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/icons/logo";

export function NavBar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto max-w-screen-xl flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="text-lg font-semibold">Nyaatify</span>
        </Link>

        <div className="flex items-center space-x-8">
          <Link href="/" className={`text-sm transition-all hover:text-primary ${pathname === "/" ? "text-primary" : "text-gray-500"}`}>
            {t("nav.home")}
          </Link>
          <Link href="/download" className={`text-sm transition-all hover:text-primary ${pathname === "/download" ? "text-primary" : "text-gray-500"}`}>
            {t("nav.download")}
          </Link>
          <Link href="/settings/general" className={`text-sm text-sm transition-all hover:text-primary ${pathname.startsWith("/settings") ? "text-primary" : "text-gray-500"}`}>
            {t("nav.settings")}
          </Link>
          <Link href="/logout" className={`text-sm text-sm transition-all hover:text-primary text-gray-500`}>
            {t("nav.logout")}
          </Link>
        </div>
      </div>
    </nav>
  );
}
