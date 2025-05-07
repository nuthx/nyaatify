"use client";

import { toast } from "sonner"
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CronExpressionParser } from "cron-parser";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ListCard } from "@/components/listcard";
import { RefreshCw } from "lucide-react";

export default function RSSSettings() {
  const { t } = useTranslation();
  const [nextRunTime, setNextRunTime] = useState("");

  const rssForm = createForm({
    name: { schema: "name" },
    url: { schema: "url" },
    cron: { schema: "required", default: "0 */30 * * * *" }
  })();

  const { data: rssData, isLoading: rssLoading, mutate: rssMutate } = useData(API.RSS, t("toast.failed.fetch_list"));

  // Set page title
  useEffect(() => {
    document.title = `${t("st.metadata.rss")} - Nyaatify`;
  }, [t]);

  // Display next run time when cron changes
  useEffect(() => {
    try {
      const interval = CronExpressionParser.parse(rssForm.getValues("cron"));
      setNextRunTime(interval.next().toDate().toLocaleString());
    } catch (error) {
      setNextRunTime(error.message);
    }
  }, [rssForm.watch("cron")]);

  const handleAdd = async (values) => {
    const result = await handleRequest("POST", API.RSS, values, t("toast.failed.add"));
    if (result) {
      rssForm.reset();
      rssMutate();
    }
  };

  const handleDelete = async (id) => {
    const result = await handleRequest("DELETE", `${API.RSS}/${id}`, null, t("toast.failed.delete"));
    if (result) {
      rssMutate();
    }
  };

  const handleRefresh = async (name) => {
    const result = await handleRequest("POST", `${API.RSS}/refresh`, { name }, t("toast.failed.refresh_rss"));
    if (result) {
      toast(t("toast.start.refresh_rss"));
      rssMutate();
    }
  };

  if (rssLoading) {
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
                    <Input className="w-full lg:w-72 transition-width duration-300 ease-in-out" placeholder="Subscription" {...field} />
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
                    <Input className="w-full lg:w-72 transition-width duration-300 ease-in-out" placeholder="0 */30 * * * *" {...field} />
                  </FormControl>
                  <FormDescription>{t("st.rss.list.next")}: {nextRunTime}</FormDescription>
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
                <p className="text-sm text-muted-foreground break-all">{rss.url}</p>
                <p className="text-sm text-muted-foreground break-all">{t("st.rss.list.cron")}: {rss.cron}</p>
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
    </>
  );
}
