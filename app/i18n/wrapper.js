"use client";

import { useState, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './config';

export function I18nWrapper({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
