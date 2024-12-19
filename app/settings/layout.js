"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Nav } from "@/components/settings";
import { Separator } from "@/components/ui/separator";

export default function SettingsLayout({ children }) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <h2 className="container mx-auto max-w-screen-xl flex py-12 text-3xl font-bold">{t('st.title')}</h2>
      <Separator />
      <div className="container mx-auto max-w-screen-xl flex py-8">
        <nav className="w-80 pr-8 space-y-2">
          <Nav label={t('st.nav.general')} path="/settings" />
          <Nav label={t('st.nav.rss')} path="/settings/rss" />
          <Nav label={t('st.nav.server')} path="/settings/server" />
          <Nav label={t('st.nav.notification')} path="/settings/notification" />
          <Nav label={t('st.nav.user')} path="/settings/user" />
          <Nav label={t('st.nav.about')} path="/settings/about" />
        </nav>

        <div className="flex-1 space-y-6">
          {children}
        </div>
      </div>
    </>
  );
}
