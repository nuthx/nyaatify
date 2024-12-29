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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge"
import { Trash2Icon } from "lucide-react";

export default function RSSSettings() {
  const rssApi = "/api/settings/rss";
  const rssAddApi = "/api/settings/rss/add";
  const rssDeleteApi = "/api/settings/rss/delete";

  const { t } = useTranslation();
  const { toast } = useToast()
  const [rssList, setRSSList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

  const fetchRSS = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
          {isLoading ? (
            Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between px-6 h-20 border-b last:border-none">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-64" />
                </div>
              </div>
            ))
          ) : rssList.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-sm text-zinc-500">
              {t("st.rss.subscription.empty")}
            </div>
          ) : (
            rssList.map((rss) => (
              <div key={rss.id} className="flex items-center justify-between px-6 py-4 border-b last:border-none">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium">{rss.name}</h5>
                    <Badge variant="outline">{rss.type}</Badge>
                  </div>
                  <p className="text-sm text-zinc-500">{rss.url}</p>
                  <p className="text-sm text-zinc-500">{t("st.rss.subscription.cron")}: {rss.cron}</p>
                </div>
                <div className="flex space-x-4 items-center">
                  <p className="text-sm text-zinc-700 bg-zinc-100 px-3 py-2 rounded-md whitespace-nowrap">
                    {rss.state === "running" ? (
                      <>{t("st.rss.subscription.running")}</>
                    ) : (
                      <>{t("st.rss.subscription.next")}: {new Date(rss.next).toLocaleString()}</>
                    )}
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2Icon />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("st.rss.subscription.delete.title")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("st.rss.subscription.delete.description")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("glb.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteRSS(rss.id, rss.name)}>{t("glb.delete")}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
