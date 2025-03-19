"use client";

import { toast } from "sonner"
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { API } from "@/lib/http/api";
import { useData } from "@/lib/http/swr";
import { handleRequest } from "@/lib/http/request";
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ListCard } from "@/components/listcard";
import { RefreshCw } from "lucide-react";

export default function RSSSettings() {
  const { t } = useTranslation();

  const rssForm = useForm({
    resolver: zodResolver(z.object({
      name: z.string()
        .min(2, { message: t("validate.name_2") })
        .max(40, { message: t("validate.name_40") }),
      url: z.string()
        .url({ message: t("validate.url_invalid") })
        .startsWith("http", { message: t("validate.url_http") })
        .refine(url => !url.endsWith("/"), { message: t("validate.url_slash") }),
      cron: z.string()
        .min(1, { message: t("validate.required") })
    })),
    defaultValues: {
      name: "",
      url: "",
      cron: "0 */10 * * * *",
    },
  })

  const aiForm = useForm({
    resolver: zodResolver(z.object({
      aiPriority: z.string(),
      aiApi: z.string()
        .url({ message: t("validate.api_invalid") })
        .startsWith("http", { message: t("validate.api_http") })
        .refine(url => !url.endsWith("/"), { message: t("validate.api_slash") })
        .or(z.literal("")),
      aiKey: z.string(),
      aiModel: z.string()
    })),
    defaultValues: {
      aiPriority: "local",
      aiApi: "",
      aiKey: "",
      aiModel: "",
    },
  })

  const { data: rssData, isLoading: rssLoading, mutate: mutateRss } = useData(API.RSS, t("toast.failed.fetch_list"));
  const { data: configData, isLoading: configLoading, mutate: mutateConfig } = useData(API.CONFIG, t("toast.failed.fetch_config"));

  // Set page title
  useEffect(() => {
    document.title = `${t("st.metadata.rss")} - Nyaatify`;
  }, [t]);

  useEffect(() => {
    if (configData) {
      aiForm.setValue("aiPriority", configData?.aiPriority);
      aiForm.setValue("aiApi", configData?.aiApi);
      aiForm.setValue("aiKey", configData?.aiKey);
      aiForm.setValue("aiModel", configData?.aiModel);
    }
  }, [configData]);

  const handleAdd = async (values) => {
    const result = await handleRequest("POST", API.RSS, values, t("toast.failed.add"));
    if (result) {
      rssForm.reset();
      mutateRss();
    }
  };

  const handleDelete = async (id) => {
    const result = await handleRequest("DELETE", `${API.RSS}/${id}`, null, t("toast.failed.delete"));
    if (result) {
      mutateRss();
    }
  };

  const handleRefresh = async (name) => {
    const result = await handleRequest("POST", `${API.RSS}/refresh`, { name }, t("toast.failed.refresh_rss"));
    if (result) {
      toast(t("toast.start.refresh_rss"));
      mutateRss();
    }
  };

  const handleSaveConfig = async (values) => {
    const result = await handleRequest("PATCH", API.CONFIG, values, t("toast.failed.save"));
    if (result) {
      toast(t("toast.success.save"));
      mutateConfig();
    }
  };

  if (rssLoading || configLoading) {
    return <></>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("st.rss.add.title")}</CardTitle>
          <CardDescription>{t("st.rss.add.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...rssForm}>
            <form onSubmit={rssForm.handleSubmit((values) => handleAdd(values))} className="space-y-6" noValidate>
              <FormField control={rssForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.rss.add.name")}</FormLabel>
                  <FormControl>
                    <Input className="w-72" placeholder="Subscription" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={rssForm.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.rss.add.url")}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder="https://nyaa.si/?page=rss" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={rssForm.control} name="cron" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.rss.add.cron")}</FormLabel>
                  <FormControl>
                    <Input className="w-72" placeholder="0 */10 * * * *" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <Button type="submit">{t("glb.add")}</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("st.rss.list.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ListCard
            items={rssData?.rss || []}
            empty={t("st.rss.list.empty")}
            content={(rss) => (
              <>
                <p className="text-sm text-muted-foreground">{rss.url}</p>
                <p className="text-sm text-muted-foreground">{t("st.rss.list.cron")}: {rss.cron}</p>
              </>
            )}
            state={(rss) => (
              rss.state === 0 ? (
                <>{t("st.rss.list.running")}</>
              ) : (
                <>{t("st.rss.list.next")}: {new Date(rss.next).toLocaleString()}</>
              )
            )}
            menu={(rss) => (
              <>
                <DropdownMenuItem onClick={() => handleRefresh(rss.name)}>
                  <RefreshCw />{t("st.rss.list.refresh")}
                </DropdownMenuItem>
              </>
            )}
            deleteable={(rss) => rss.state === 1}
            deleteDesc={t("st.rss.list.alert")}
            onDelete={(rss) => handleDelete(rss.id)}
          />
        </CardContent>
      </Card>

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
                        <Input className="w-full" placeholder="https://api.openai.com/v1" {...field} />
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
