"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import pkg from "@/package.json";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Settings() {
  const { t } = useTranslation();
  const currentVersion = pkg.version;

  // Set page title
  useEffect(() => {
    document.title = `${t("st.metadata.about")} - Nyaatify`;
  }, [t]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("st.abt.version.title")}</CardTitle>
          <CardDescription>{t("st.abt.version.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <a>{t("glb.version")}: {currentVersion}</a>
        </CardContent>
      </Card>
    </>
  )
}
