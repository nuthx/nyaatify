"use client";

import { useEffect } from "react";
import { useTranslation, Trans } from "react-i18next";
import pkg from "@/package.json";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { NyaatifyInfo } from "@/components/nyaatify-info";

export default function Settings() {
  const { t } = useTranslation();
  const currentVersion = pkg.version;

  // Set page title
  useEffect(() => {
    document.title = `${t("st.metadata.about")} - Nyaatify`;
  }, [t]);

  return (
    <>
      <NyaatifyInfo className="mt-4 mb-8" />

      <Card>
        <CardHeader>
          <CardTitle>{t("st.abt.project.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-2">
            <h4 className="font-bold">{t("glb.version")}</h4>
            <p className="text-sm text-muted-foreground">v{currentVersion}</p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="font-bold">{t("st.abt.project.author")}</h4>
            <p className="text-sm text-muted-foreground">
              <Trans i18nKey="st.abt.project.author_desc">
                <a href="https://github.com/nuthx" target="_blank" className="underline" />
              </Trans>
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="font-bold">{t("st.abt.project.license")}</h4>
            <p className="text-sm text-muted-foreground">
              <Trans i18nKey="st.abt.project.license_desc">
                <a href="https://github.com/nuthx/nyaatify/blob/main/LICENSE" target="_blank" className="underline" />
              </Trans>
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="font-bold">{t("st.abt.project.repository")}</h4>
            <p className="text-sm text-muted-foreground">
              <a href="https://github.com/nuthx/nyaatify" target="_blank" className="underline">Github</a>
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="font-bold">{t("st.abt.project.contribute")}</h4>
            <p className="text-sm text-muted-foreground">
              <Trans i18nKey="st.abt.project.contributor_desc">
                <a href="https://github.com/nuthx/nyaatify/pulls" target="_blank" className="underline" />
                <a href="https://github.com/nuthx/nyaatify/issues" target="_blank" className="underline" />
              </Trans>
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
