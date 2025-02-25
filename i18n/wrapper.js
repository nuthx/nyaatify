"use client";

import i18n from "@/i18n/config";
import { useState, useEffect } from "react";
import { I18nextProvider } from "react-i18next";

export function I18nWrapper({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  )
}
