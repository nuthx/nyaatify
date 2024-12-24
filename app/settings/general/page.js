"use client";

import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme()

  const handleLanguageChange = (value) => {
    i18n.changeLanguage(value);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("st.gr.theme.title")}</CardTitle>
          <CardDescription>{t("st.gr.theme.description")}</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">{t("st.gr.theme.system")}</SelectItem>
              <SelectItem value="light">{t("st.gr.theme.light")}</SelectItem>
              <SelectItem value="dark">{t("st.gr.theme.dark")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("st.gr.language.title")}</CardTitle>
          <CardDescription>{t("st.gr.language.description")}</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent>
          <Select defaultValue={i18n.language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="zh">简体中文</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </>
  )
}
