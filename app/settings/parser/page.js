"use client";

import { toast } from "sonner"
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API } from "@/lib/http/api";
import { useData } from "@/lib/http/swr";
import { handleRequest } from "@/lib/http/request";
import { createForm } from "@/lib/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RSSSettings() {
  const { t } = useTranslation();

  const aiForm = createForm({
    aiPriority: { schema: "trim", default: "local" },
    aiApi: { schema: "url" },
    aiKey: { schema: "required" },
    aiModel: { schema: "trim" }
  })();

  const { data: configData, isLoading: configLoading, mutate: mutateConfig } = useData(API.CONFIG, t("toast.failed.fetch_config"));

  // Set page title
  useEffect(() => {
    document.title = `${t("st.metadata.parser")} - Nyaatify`;
  }, [t]);

  useEffect(() => {
    if (configData) {
      aiForm.setValue("aiPriority", configData?.aiPriority);
      aiForm.setValue("aiApi", configData?.aiApi);
      aiForm.setValue("aiKey", configData?.aiKey);
      aiForm.setValue("aiModel", configData?.aiModel);
    }
  }, [configData]);

  const handleSaveConfig = async (values) => {
    const result = await handleRequest("PATCH", API.CONFIG, values, t("toast.failed.save"));
    if (result) {
      toast(t("toast.success.save"));
      mutateConfig();
    }
  };

  if (configLoading) {
    return <></>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("st.rss.ai.title")}</CardTitle>
          <CardDescription>{t("st.rss.ai.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...aiForm}>
            <form onSubmit={aiForm.handleSubmit(handleSaveConfig)} className="space-y-6" noValidate>
              <FormField control={aiForm.control} name="aiPriority" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.rss.ai.priority")}</FormLabel>
                  <Select defaultValue={configData?.aiPriority || field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-72">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="local">{t("st.rss.ai.local")}</SelectItem>
                      <SelectItem value="ai">{t("st.rss.ai.ai")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
              />
              {aiForm.watch("aiPriority") === "ai" && (
                <>
                  <FormField control={aiForm.control} name="aiApi" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("st.rss.ai.api")}</FormLabel>
                      <FormControl>
                        <Input className="w-full" placeholder="https://api.openai.com/v1/chat/completions" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                  />
                  <FormField control={aiForm.control} name="aiKey" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("st.rss.ai.key")}</FormLabel>
                      <FormControl>
                        <Input className="w-full" placeholder="sk-1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                  />
                  <FormField control={aiForm.control} name="aiModel" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("st.rss.ai.model")}</FormLabel>
                      <FormControl>
                        <Input className="w-72" placeholder="gpt-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                  />
                </>
              )}
              <Button type="submit">{t("glb.save")}</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
