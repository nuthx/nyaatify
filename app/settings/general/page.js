"use client";

import useSWR from "swr"
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next";
import { handlePost } from "@/lib/handlers";
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

export default function Settings() {
  const configApi = "/api/config";

  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const handleLanguageChange = (value) => {
    i18n.changeLanguage(value);
  };

  const { data, error, isLoading, mutate } = useSWR(configApi, async (url) => {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error);
    }
    return data;
  });

  useEffect(() => {
    if (error) {
      toast({
        title: t("toast.failed.fetch_config"),
        description: error.message,
        variant: "destructive"
      });
    }
  }, [error]);

  const handleSaveConfig = async (values) => {
    console.log(values);
    
    const result = await handlePost(configApi, JSON.stringify(values));
    if (result.state === "success") {
      toast({
        title: t("toast.success.save")
      });
      mutate(configApi);
    } else {
      toast({
        title: t("toast.failed.save"),
        description: result.message,
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <></>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("st.gr.theme.title")}</CardTitle>
          <CardDescription>{t("st.gr.theme.description")}</CardDescription>
        </CardHeader>
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

      <Card>
        <CardHeader>
          <CardTitle>{t("st.gr.sv_state.title")}</CardTitle>
          <CardDescription>{t("st.gr.sv_state.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select defaultValue={data.show_server_state} onValueChange={(value) => handleSaveConfig({ show_server_state: value })}>
            <SelectTrigger className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t("glb.show")}</SelectItem>
              <SelectItem value="0">{t("glb.hide")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </>
  )
}
