"use client";

import { useTranslation } from "react-i18next";
import { Nav } from "@/components/settings";
import { Separator } from "@/components/ui/separator";

export default function SettingsLayout({ children }) {
  const { t } = useTranslation();

  return (
    <>
      <h2 className="container mx-auto max-w-screen-xl flex py-12 text-3xl font-bold">{t("st.title")}</h2>
      <Separator />
      <div className="container mx-auto max-w-screen-xl flex py-8">
        <nav className="w-72 pr-8 space-y-2">
          <Nav label={t("st.nav.general")} path="/settings/general" />
          <Nav label={t("st.nav.rss")} path="/settings/rss" />
          <Nav label={t("st.nav.downloader")} path="/settings/downloader" />
          <Nav label={t("st.nav.notification")} path="/settings/notification" />
          <Nav label={t("st.nav.user")} path="/settings/user" />
          <Nav label={t("st.nav.logs")} path="/settings/logs" />
          <Nav label={t("st.nav.about")} path="/settings/about" />
        </nav>

        <div className="flex-1 space-y-6 min-w-0">
          {children}
        </div>
      </div>
    </>
  );
}
