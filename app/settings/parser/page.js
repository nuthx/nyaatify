"use client";

import { toast } from "sonner"
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API } from "@/lib/http/api";
import { useData } from "@/lib/http/swr";
import { handleRequest } from "@/lib/http/request";
import { createForm } from "@/lib/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
  FormMessage
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
    aiApi: { schema: "url" },
    aiKey: { schema: "required" },
    aiModel: { schema: "required" }
  })();

  const { data: configData, isLoading: configLoading, mutate: mutateConfig } = useData(API.CONFIG, t("toast.failed.fetch_config"));

  // Set page title
  useEffect(() => {
    document.title = `${t("st.metadata.parser")} - Nyaatify`;
  }, [t]);

  useEffect(() => {
    if (configData) {
      aiForm.setValue("aiApi", configData?.aiApi);
      aiForm.setValue("aiModel", configData?.aiModel);
    }
  }, [configData]);

  const handleTest = async (values) => {
    const result = await handleRequest("POST", `${API.CONFIG}/test/ai`, values, t("toast.failed.test"));
    if (result) {
      toast.success(t("toast.success.test"), {
        description: result.data.response
      });
    }
  };

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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("st.pr.priority.title")}</CardTitle>
          <CardDescription>{t("st.pr.priority.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select defaultValue={configData?.aiPriority || "local-only"} onValueChange={(value) => handleSaveConfig({ aiPriority: value })}>
            <SelectTrigger className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local-only">{t("st.pr.priority.local-only")}</SelectItem>
              <SelectItem value="ai-first">{t("st.pr.priority.ai-first")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("st.pr.ai.title")}</CardTitle>
          <CardDescription>{t("st.pr.ai.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...aiForm}>
            <form onSubmit={aiForm.handleSubmit(handleSaveConfig)} className="space-y-6" noValidate>
              <FormField control={aiForm.control} name="aiApi" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.pr.ai.api")}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder="https://api.openai.com/v1/chat/completions" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={aiForm.control} name="aiKey" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.pr.ai.key")}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder={configData?.aiKey || "sk-1234567890"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={aiForm.control} name="aiModel" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.pr.ai.model")}</FormLabel>
                  <FormControl>
                    <Input className="w-72" placeholder="gpt-4" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <div className="flex gap-2 items-center">
                <Button type="submit">{t("glb.save")}</Button>
                <Button type="button" variant="outline" onClick={aiForm.handleSubmit((values) => handleTest(values))}>{t("glb.test")}</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline">{t("glb.reset")}</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("st.pr.ai.reset.title")}</AlertDialogTitle>
                      <AlertDialogDescription>{t("st.pr.ai.reset.description")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("glb.cancel")}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleSaveConfig({ aiApi: "", aiKey: "", aiModel: "" })}>{t("glb.reset")}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
