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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ListCard } from "@/components/settings";

export default function RSSSettings() {
  const rssApi = "/api/settings/rss";
  const rssAddApi = "/api/settings/rss/add";
  const rssDeleteApi = "/api/settings/rss/delete";

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

  useEffect(() => {
    fetchRSS();

    // Set interval to fetch RSS list every 3 seconds
    const pollingInterval = setInterval(() => {
      fetchRSS();
    }, 3000);

    return () => clearInterval(pollingInterval);
  }, []);

  const fetchRSS = async () => {
    try {
      const response = await fetch(rssApi);
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

  const handleAddRSS = async (values) => {
    try {
      const response = await fetch(rssAddApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        form.reset();
        fetchRSS();
      } else {
        toast({
          title: t("st.rss.toast.add"),
          description: data.message,
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

  const handleDeleteRSS = async (id, name) => {
    try {
      const response = await fetch(`${rssDeleteApi}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });

      const data = await response.json();

      if (response.ok) {
        fetchRSS();
      } else {
        toast({
          title: t("st.rss.toast.delete"),
          description: data.message,
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
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("st.rss.add.name")}</FormLabel>
                    <FormControl>
                      <Input className="w-72" placeholder="Subscription" required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("st.rss.add.url")}</FormLabel>
                    <FormControl>
                      <Input className="w-full" placeholder="https://nyaa.si/?page=rss" required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cron"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("st.rss.add.cron")}</FormLabel>
                    <FormControl>
                      <Input className="w-72" placeholder="0 */10 * * * *" required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">{t("st.rss.add.add")}</Button>
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
    </>
  );
}
