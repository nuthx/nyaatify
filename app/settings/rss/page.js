"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { handlePost } from "@/lib/handlers";
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
import { ListCard } from "@/components/settings";
import { RefreshCw } from "lucide-react";

export default function RSSSettings() {
  const settingApi = "/api/settings/config";
  const settingListApi = "/api/settings/list";

  const { t } = useTranslation();
  const { toast } = useToast()
  const [rssList, setRSSList] = useState([]);

  const rssFormSchema = z.object({
    name: z.string()
      .min(2, { message: t("validate.name_2") })
      .max(40, { message: t("validate.name_40") }),
    url: z.string()
      .url({ message: t("validate.url_invalid") })
      .startsWith("http", { message: t("validate.url_http") })
      .refine(url => !url.endsWith("/"), { message: t("validate.url_slash") }),
    cron: z.string()
  })

  const rssForm = useForm({
    resolver: zodResolver(rssFormSchema),
    defaultValues: {
      name: "",
      url: "",
      cron: "0 */10 * * * *",
    },
  })

  const aiFormSchema = z.object({
    ai_priority: z.string(),
    ai_api: z.string()
      .url({ message: t("validate.api_invalid") })
      .startsWith("http", { message: t("validate.api_http") })
      .refine(url => !url.endsWith("/"), { message: t("validate.api_slash") })
      .or(z.literal("")),
    ai_key: z.string(),
    ai_model: z.string()
  })

  const aiForm = useForm({
    resolver: zodResolver(aiFormSchema),
    defaultValues: {
      ai_priority: "local",
      ai_api: "",
      ai_key: "",
      ai_model: "",
    },
  })

  useEffect(() => {
    fetchRSS();
    fetchConfig();

    // Set interval to fetch RSS list every 3 seconds
    const pollingInterval = setInterval(() => {
      fetchRSS();
    }, 3000);

    return () => clearInterval(pollingInterval);
  }, []);

  const fetchRSS = async () => {
    try {
      const response = await fetch(`${settingListApi}?type=rss`);
      const data = await response.json();
      setRSSList(data.rss);
    } catch (error) {
      toast({
        title: t("toast.failed.fetch_rss"),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch(settingApi);
      const data = await response.json();
      aiForm.reset({
        ai_priority: data.ai_priority,
        ai_api: data.ai_api,
        ai_key: data.ai_key,
        ai_model: data.ai_model,
      });
    } catch (error) {
      toast({
        title: t("toast.failed.fetch_config"),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleManageRSS = async (action, values) => {
    const result = await handlePost(settingListApi, JSON.stringify({ type: "rss", action, data: values }));
    if (action === "refresh") {
      toast({
        title: t("toast.start.refresh_rss")
      });
    }
    if (result.state === "success") {
      if (action === "add") {
        rssForm.reset();
      }
      fetchRSS();
    } else {
      toast({
        title: t(`toast.failed.${action}_rss`),
        description: result.message,
        variant: "destructive"
      });
    }
  };

  const handleSaveConfig = async (values) => {
    const result = await handlePost(settingApi, JSON.stringify(values));
    if (result.state === "success") {
      toast({
        title: t("toast.success.save")
      });
      fetchConfig();
    } else {
      toast({
        title: t("toast.failed.save"),
        description: result.message,
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("st.rss.add.title")}</CardTitle>
          <CardDescription>{t("st.rss.add.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...rssForm}>
            <form onSubmit={rssForm.handleSubmit((values) => handleManageRSS("add", values))} className="space-y-6" noValidate>
              <FormField control={rssForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.rss.add.name")}</FormLabel>
                  <FormControl>
                    <Input className="w-72" placeholder="Subscription" required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={rssForm.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.rss.add.url")}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder="https://nyaa.si/?page=rss" required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={rssForm.control} name="cron" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.rss.add.cron")}</FormLabel>
                  <FormControl>
                    <Input className="w-72" placeholder="0 */10 * * * *" required {...field} />
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
          <CardTitle>{t("st.rss.subscription.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ListCard
            items={rssList}
            empty={t("st.rss.subscription.empty")}
            content={(rss) => (
              <>
                <p className="text-sm text-zinc-500">{rss.url}</p>
                <p className="text-sm text-zinc-500">{t("st.rss.subscription.cron")}: {rss.cron}</p>
              </>
            )}
            state={(rss) => (
              rss.state === "running" ? (
                <>{t("st.rss.subscription.running")}</>
              ) : (
                <>{t("st.rss.subscription.next")}: {new Date(rss.next).toLocaleString()}</>
              )
            )}
            menu={(rss) => (
              <>
                <DropdownMenuItem onClick={() => handleManageRSS("refresh", rss)}>
                  <RefreshCw />{t("st.rss.subscription.refresh")}
                </DropdownMenuItem>
              </>
            )}
            onDelete={(rss) => handleManageRSS("delete", rss)}
            deleteable={(rss) => rss.state !== "running"}
            deleteDescription={t("st.rss.subscription.alert")}
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
              <FormField control={aiForm.control} name="ai_priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.rss.ai.priority")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
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
              {aiForm.watch("ai_priority") === "ai" && (
                <>
                  <FormField control={aiForm.control} name="ai_api" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("st.rss.ai.api")}</FormLabel>
                      <FormControl>
                        <Input className="w-full" placeholder="https://api.openai.com/v1" required {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                  />
                  <FormField control={aiForm.control} name="ai_key" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("st.rss.ai.key")}</FormLabel>
                      <FormControl>
                        <Input className="w-full" placeholder="sk-1234567890" required {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                  />
                  <FormField control={aiForm.control} name="ai_model" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("st.rss.ai.model")}</FormLabel>
                      <FormControl>
                        <Input className="w-72" placeholder="gpt-4" required {...field} />
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
