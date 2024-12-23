"use client";

import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const { t } = useTranslation();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('st.about.version.title')}</CardTitle>
          <CardDescription>{t('st.about.version.description')}</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent>
          <p>{t('st.about.version.current')}: 0.0.1</p>
          <p>{t('st.about.version.latest')}: 0.0.1</p>
        </CardContent>
      </Card>
    </>
  )
}
