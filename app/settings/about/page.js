"use client";

import useSWR from "swr"
import { toast } from "sonner"
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
  const configApi = "/api/configs";

  const { t } = useTranslation();
  const currentVersion = pkg.version;

  const { data, error, isLoading } = useSWR(configApi, async (url) => {
    const response = await fetch(url);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }
    return result.data;
  });

  // Set page title
  useEffect(() => {
    document.title = `${t("st.metadata.about")} - Nyaatify`;
  }, [t]);

  useEffect(() => {
    if (error) {
      toast.error(t("toast.failed.fetch_config"), {
        description: error.message,
      });
    }
  }, [error]);

  if (isLoading) {
    return <></>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("st.abt.version.title")}</CardTitle>
          <CardDescription>{t("st.abt.version.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("st.abt.version.app_version")}: v{currentVersion}</p>
          <p className="text-sm text-muted-foreground">{t("st.abt.version.db_version")}: v{data?.db_version}</p>
        </CardContent>
      </Card>
    </>
  )
}
