"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";

export default function SettingsLayout({ children }) {
  const { t } = useTranslation();

  return (
    <>
      <h2 className="container mx-auto max-w-screen-xl flex py-12 text-3xl font-bold">{t("st.title")}</h2>
      <Separator />
      <div className="container mx-auto max-w-screen-xl flex py-8 gap-8">
        <div className="flex flex-col w-72 gap-2">
          <NavLink href="/settings/general" />
          <NavLink href="/settings/rss" />
          <NavLink href="/settings/parser" />
          <NavLink href="/settings/downloader" />
          <NavLink href="/settings/notification" />
          <NavLink href="/settings/user" />
          <NavLink href="/settings/logs" />
          <NavLink href="/settings/about" />
        </div>

        <div className="flex-1 space-y-6 min-w-0">
          {children}
        </div>
      </div>
    </>
  );
}

function NavLink({ href }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const { t } = useTranslation();
  
  return (
    <Link
      href={href}
      className={`px-4 py-3 rounded-lg hover:bg-primary/5 dark:hover:bg-accent ${
        isActive ? "bg-primary/5 dark:bg-accent" : ""
      }`}
    >
      {t(`st.nav.${href.replace("/settings/", "")}`)}
    </Link>
  );
}
