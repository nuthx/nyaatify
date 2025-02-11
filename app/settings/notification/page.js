"use client";

import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { handleRequest } from "@/lib/handlers";
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
import { BellRing } from "lucide-react";

export default function NotificationSettings() {
  const notificationApi = "/api/notification";
  const configApi = "/api/config";

  const { t } = useTranslation();

  const notificationFrom = useForm({
    resolver: zodResolver(z.object({
      name: z.string()
        .min(2, { message: t("validate.name_2") })
        .max(40, { message: t("validate.name_40") }),
      trigger: z.string(),
      condition: z.string(),
      type: z.string(),
      url: z.string()
        .url({ message: t("validate.url_invalid") })
        .startsWith("http", { message: t("validate.url_http") })
        .refine(url => !url.endsWith("/"), { message: t("validate.url_slash") }),
      token: z.string()
        .min(1, { message: t("validate.required") }),
      title: z.string()
        .min(1, { message: t("validate.required") }),
      message: z.string()
        .min(1, { message: t("validate.required") }),
      extra: z.string()
    })),
    defaultValues: {
      name: "",
      trigger: "NewAnimeRelease",
      condition: "",
      type: "Bark",
      url: "https://api.day.app",
      token: "",
      title: "",
      message: "",
      extra: ""
    },
  })

  const selectedType = notificationFrom.watch("type");
  const urlPlaceholders = {
    Bark: "https://api.day.app",
    Gotify: "https://your-server.com",
    ServerChan: "https://sctapi.ftqq.com",
  };

  const selectedTrigger = notificationFrom.watch("trigger");
  const conditionNotice = {
    NewAnimeRelease: t("st.nt.add.condition_notice_rss"),
    DownloadFinished: t("st.nt.add.condition_notice_download"),
  };

  const fetcher = async (url) => {
    const response = await fetch(url);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }
    return result.data;
  };

  const { data: notificationData, error: notificationError, isLoading: notificationLoading } = useSWR(notificationApi, fetcher);
  const { data: configData, error: configError, isLoading: configLoading } = useSWR(configApi, fetcher);

  useEffect(() => {
    if (notificationError) {
      toast.error(t("toast.failed.fetch_notification"), {
        description: notificationError.message,
      });
    }
  }, [notificationError]);

  useEffect(() => {
    if (configError) {
      toast.error(t("toast.failed.fetch_config"), {
        description: configError.message,
      });
    }
  }, [configError]);

  // Set default url for notification type
  useEffect(() => {
    const defaultUrls = {
      Bark: "https://api.day.app",
      Gotify: "",
      ServerChan: "https://sctapi.ftqq.com"
    };
    notificationFrom.setValue("url", defaultUrls[selectedType]);
  }, [selectedType]);

  const handleAdd = async (values) => {
    const result = await handleRequest("POST", notificationApi, JSON.stringify({ values }));
    if (result.success) {
      notificationFrom.reset();
      mutate(notificationApi);
    } else {
      toast.error(t("toast.failed.add_notification"), {
        description: result.message,
      });
    }
  };

  const handleTest = async (values) => {
    const result = await handleRequest("POST", `${notificationApi}/${values.name}/test`, JSON.stringify({ values }));
    if (result.success) {
      toast.success(t("toast.success.send"));
    } else {
      toast.error(t("toast.failed.send_notification"), {
        description: result.message,
      });
    }
  };

  const handleDelete = async (name) => {
    const result = await handleRequest("DELETE", `${notificationApi}/${name}`);
    if (result.success) {
      mutate(notificationApi);
    } else {
      toast.error(t("toast.failed.delete_notification"), {
        description: result.message,
      });
    }
  };

  if (notificationLoading || configLoading) {
    return <></>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("st.nt.add.title")}</CardTitle>
          <CardDescription>{t("st.nt.add.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...notificationFrom}>
            <form onSubmit={notificationFrom.handleSubmit((values) => handleAdd(values))} className="space-y-6" noValidate>
              <FormField control={notificationFrom.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.nt.add.name")}</FormLabel>
                  <FormControl>
                    <Input className="w-72" placeholder="Notification" required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="trigger" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.nt.add.trigger")}</FormLabel>
                  <Select defaultValue={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-72">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NewAnimeRelease">{t("st.nt.trigger.release")}</SelectItem>
                      <SelectItem value="DownloadFinished">{t("st.nt.trigger.download")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="condition" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.nt.add.condition")}</FormLabel>
                  <FormControl>
                    <Input className="w-72" placeholder="name1, name2" required {...field} />
                  </FormControl>
                  <FormMessage className="font-normal text-muted-foreground">
                    {conditionNotice[selectedTrigger]}
                  </FormMessage>
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.nt.add.type")}</FormLabel>
                  <Select defaultValue={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-72">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Bark">{t("st.nt.add.type_bark")}</SelectItem>
                      <SelectItem value="Gotify">{t("st.nt.add.type_gotify")}</SelectItem>
                      <SelectItem value="ServerChan">{t("st.nt.add.type_serverchan")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="font-normal text-muted-foreground">
                    {selectedType === "Bark" && <a href="https://bark.day.app/#/tutorial" target="_blank" className="hover:underline">{t("st.nt.add.type_notice")}</a>}
                    {selectedType === "Gotify" && <a href="https://gotify.net/docs/pushmsg" target="_blank" className="hover:underline">{t("st.nt.add.type_notice")}</a>}
                    {selectedType === "ServerChan" && <a href="https://sct.ftqq.com/sendkey" target="_blank" className="hover:underline">{t("st.nt.add.type_notice")}</a>}
                  </FormMessage>
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.nt.add.url")}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder={urlPlaceholders[selectedType]} required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="token" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.nt.add.token")}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder="Token" required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.nt.add.push_title")}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder="Title" required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.nt.add.push_message")}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder="Message" required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="extra" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.nt.add.extra")}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder="icon=https://example.com/icon.png&sound=default" required {...field} />
                  </FormControl>
                  <FormMessage className="font-normal text-muted-foreground">
                    {t("st.nt.add.extra_notice")}
                  </FormMessage>
                </FormItem>
              )}
              />
              <div className="flex gap-2">
                <Button type="submit">{t("glb.add")}</Button>
                <Button type="button" variant="outline" onClick={notificationFrom.handleSubmit((values) => handleTest(values))}>{t("glb.test")}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("st.nt.list.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ListCard
            items={notificationData?.notification || []}
            empty={t("st.nt.list.empty")}
            content={(notification) => (
              <>
                <p className="text-sm text-muted-foreground">{notification.url}</p>
                {notification.condition && (<p className="text-sm text-muted-foreground">{t("st.nt.list.condition")}: {notification.condition}</p>)}
                <p className="text-sm text-muted-foreground">{t("st.nt.list.push_title")}: {notification.title}</p>
                <p className="text-sm text-muted-foreground">{t("st.nt.list.push_message")}: {notification.message}</p>
                {notification.extra && (<p className="text-sm text-muted-foreground">{t("st.nt.list.extra")}: {notification.extra}</p>)}
              </>
            )}
            state={(notification) => (
              notification.trigger === "NewAnimeRelease" ? (
                <>{t("st.nt.trigger.release")}</>
              ) : (
                <>{t("st.nt.trigger.download")}</>
              )
            )}
            menu={(notification) => (
              <>
                <DropdownMenuItem onClick={() => handleTest(notification)}>
                  <BellRing />{t("st.nt.list.test")}
                </DropdownMenuItem>
              </>
            )}
            onDelete={(notification) => handleDelete(notification.name)}
            deleteable={() => true}
            deleteDescription={t("st.nt.list.alert")}
          />
        </CardContent>
      </Card>
    </>
  );
}
