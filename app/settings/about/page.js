"use client";

import Image from "next/image";
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

export default function Settings() {
  const { t } = useTranslation();
  const currentVersion = pkg.version;

  // Set page title
  useEffect(() => {
    document.title = `${t("st.metadata.about")} - Nyaatify`;
  }, [t]);

  return (
    <>
      <div className="flex flex-col items-center mt-4 mb-12">
        <Image src="/images/logo.svg" alt="Nyaatify Logo" width={72} height={72} />
        <h1 className="text-2xl font-bold mt-8">Nyaatify</h1>
        <p className="text-sm text-muted-foreground mt-2">{t("st.abt.description")}</p>
        <div className="flex gap-2 mt-5">
          <Badge variant="outline">{t("glb.version")}: v{currentVersion}</Badge>
        </div>
        
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("st.abt.project.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
