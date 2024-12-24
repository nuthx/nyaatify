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
          <CardTitle>{t('st.abt.version.title')}</CardTitle>
          <CardDescription>{t('st.abt.version.description')}</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent>
          <p>{t('st.abt.version.current')}: 0.0.1</p>
          <p>{t('st.abt.version.latest')}: 0.0.1</p>
        </CardContent>
      </Card>
    </>
  )
}
