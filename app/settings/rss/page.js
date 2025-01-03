"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ListCard } from "@/components/settings";

export default function RSSSettings() {
  const settingApi = "/api/settings/config";
  const settingListApi = "/api/settings/list";

  const { t } = useTranslation();
  const { toast } = useToast()
  const [rssList, setRSSList] = useState([]);

  const formSchema = z.object({
    name: z.string()
      .min(2, { message: t("st.rss.validate.name1") })
      .max(40, { message: t("st.rss.validate.name2") }),
    url: z.string()
      .url({ message: t("st.rss.validate.url1") })
      .startsWith("http", { message: t("st.rss.validate.url2") })
      .refine(url => !url.endsWith("/"), { message: t("st.rss.validate.url3") }),
    cron: z.string()
  })

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      url: "",
      cron: "0 */10 * * * *",
    },
  })

  const aiFormSchema = z.object({
    ai_priority: z.string(),
    ai_api: z.string()
      .url({ message: t("st.rss.validate.api1") })
      .startsWith("http", { message: t("st.rss.validate.api2") })
      .refine(url => !url.endsWith("/"), { message: t("st.rss.validate.api3") })
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
      setRSSList(data.data);
    } catch (error) {
      toast({
        title: t("st.rss.toast.fetch"),
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
        title: t("st.toast.fetch_failed"),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleAddRSS = async (values) => {
    try {
      const response = await fetch(settingListApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "rss",
          action: "add",
          data: values
        }),
      });

      const data = await response.json();

      if (response.ok) {
        form.reset();
        fetchRSS();
      } else {
        toast({
          title: t("st.rss.toast.add"),
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t("st.rss.toast.add"),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteRSS = async (name) => {
    try {
      const response = await fetch(settingListApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "rss",
          action: "delete",
          data: { name }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        fetchRSS();
      } else {
        toast({
          title: t("st.rss.toast.delete"),
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t("st.rss.toast.delete"),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleTestAI = async (values) => {
    console.log(values);
  };

  const handleSaveConfig = async (values) => {
    try {
      const response = await fetch(settingApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: t("glb.toast.save_success")
        });
      } else {
        toast({
          title: t("glb.toast.save_failed"),
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t("glb.toast.save_failed"),
        description: error.message,
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddRSS)} className="space-y-6" noValidate>
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("st.rss.add.name")}</FormLabel>
                    <FormControl>
                      <Input className="w-72" placeholder="Subscription" required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="url" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("st.rss.add.url")}</FormLabel>
                    <FormControl>
                      <Input className="w-full" placeholder="https://nyaa.si/?page=rss" required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="cron" render={({ field }) => (
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
            onDelete={handleDeleteRSS}
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
              <div className="flex gap-2">
                <Button type="submit">{t("glb.save")}</Button>
                {aiForm.watch("ai_priority") === "ai" && (
                  <>
                    <Button type="button" variant="outline" onClick={() => aiForm.reset()}>{t("glb.reset")}</Button>
                    <Button type="button" variant="outline" onClick={aiForm.handleSubmit(handleTestAI)}>{t("glb.test_connection")}</Button>
                  </>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
