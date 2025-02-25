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
  FormDescription,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ListCard } from "@/components/settings";
import { BellDot, BellMinus, BellRing } from "lucide-react";

function VariableItem({ name, description }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline">{name}</Badge>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function VariablePopover() {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger className="underline">
        {t("st.nt.add.variable_view")}
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <div className="space-y-2">
          <p className="text-sm mb-3">{t("st.nt.variable.description")}</p>
          <VariableItem name="rss" description={t("st.nt.variable.rss")} />
          <VariableItem name="title_publish" description={t("st.nt.variable.title_publish")} />
          <VariableItem name="title_jp" description={t("st.nt.variable.title_jp")} />
          <VariableItem name="title_cn" description={t("st.nt.variable.title_cn")} />
          <VariableItem name="title_en" description={t("st.nt.variable.title_en")} />
          <VariableItem name="title_romaji" description={t("st.nt.variable.title_romaji")} />
          <VariableItem name="torrent_link" description={t("st.nt.variable.torrent_link")} />
          <VariableItem name="torrent_hash" description={t("st.nt.variable.torrent_hash")} />
          <VariableItem name="torrent_size" description={t("st.nt.variable.torrent_size")} />
          <VariableItem name="cover_anilist" description={t("st.nt.variable.cover_anilist")} />
          <VariableItem name="cover_bangumi" description={t("st.nt.variable.cover_bangumi")} />
          <VariableItem name="link_anilist" description={t("st.nt.variable.link_anilist")} />
          <VariableItem name="link_bangumi" description={t("st.nt.variable.link_bangumi")} />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function NotificationSettings() {
  const notificationApi = "/api/notifications";
  const configApi = "/api/configs";

  const { t } = useTranslation();

  const notificationFrom = useForm({
    resolver: zodResolver(z.object({
      name: z.string()
        .min(2, { message: t("validate.name_2") })
        .max(40, { message: t("validate.name_40") }),
      filter: z.string(),
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
      filter: "",
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

  // Set page title
  useEffect(() => {
    document.title = `${t("st.metadata.notification")} - Nyaatify`;
  }, [t]);

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

  const handleDelete = async (id) => {
    const result = await handleRequest("DELETE", `${notificationApi}/${id}`);
    if (result.success) {
      mutate(notificationApi);
    } else {
      toast.error(t("toast.failed.delete_notification"), {
        description: result.message,
      });
    }
  };

  const handleEdit = async (id, values) => {
    const result = await handleRequest("PATCH", `${notificationApi}/${id}`, JSON.stringify({ values }));
    if (result.success) {
      mutate(notificationApi);
    } else {
      toast.error(t("toast.failed.edit_notification"), {
        description: result.message,
      });
    }
  };

  const handleTest = async (values) => {
    const result = await handleRequest("POST", `${notificationApi}/test`, JSON.stringify({ values }));
    if (result.success) {
      toast(t("toast.success.send"));
    } else {
      toast.error(t("toast.failed.send_notification"), {
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
                    <Input className="w-72" placeholder="Notification" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="filter" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.nt.add.filter")}</FormLabel>
                  <FormControl>
                    <Input className="w-72" placeholder="name1, name2" {...field} />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>{t("st.nt.add.filter_notice")}</FormDescription>
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
                  <FormMessage />
                  <FormDescription>
                    {selectedType === "Bark" && <a href="https://bark.day.app/#/tutorial" target="_blank" className="underline">{t("st.nt.add.type_notice")}</a>}
                    {selectedType === "Gotify" && <a href="https://gotify.net/docs/pushmsg" target="_blank" className="underline">{t("st.nt.add.type_notice")}</a>}
                    {selectedType === "ServerChan" && <a href="https://sct.ftqq.com/sendkey" target="_blank" className="underline">{t("st.nt.add.type_notice")}</a>}
                  </FormDescription>
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.nt.add.url")}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder={urlPlaceholders[selectedType]} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="token" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.nt.add.token")}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder="Token" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.nt.add.push_title")}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder="Title" {...field} />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    {t("st.nt.add.variable")}
                    <VariablePopover />
                  </FormDescription>
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.nt.add.push_message")}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder="Message" {...field} />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    {t("st.nt.add.variable")}
                    <VariablePopover />
                  </FormDescription>
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="extra" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.nt.add.extra")}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder="icon=https://example.com/icon.png&sound=default" {...field} />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    {t("st.nt.add.extra_notice")}
                    {t("st.nt.add.variable")}
                    <VariablePopover />
                  </FormDescription>
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
                <p className="text-sm text-muted-foreground">{t("st.nt.list.filter")}: {notification.filter || t("st.nt.list.filter_all")}</p>
                <p className="text-sm text-muted-foreground">{t("st.nt.list.push_title")}: {notification.title}</p>
                <p className="text-sm text-muted-foreground">{t("st.nt.list.push_message")}: {notification.message}</p>
                {notification.extra && (<p className="text-sm text-muted-foreground">{t("st.nt.list.extra")}: {notification.extra}</p>)}
              </>
            )}
            state={(notification) => (
              <>
                {notification.state === 1 ? t("glb.enabled") : t("glb.disabled")}
              </>
            )}
            menu={(notification) => (
              <>
                <DropdownMenuItem onClick={() => handleEdit(notification.id, { state: notification.state === 1 ? 0 : 1 })}>
                  {notification.state === 1 ? <BellMinus /> : <BellDot />}
                  {notification.state === 1 ? t("glb.disabled") : t("glb.enabled")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTest(notification)}>
                  <BellRing />{t("st.nt.list.test")}
                </DropdownMenuItem>
              </>
            )}
            deleteable={() => true}
            deleteDesc={t("st.nt.list.alert")}
            onDelete={(notification) => handleDelete(notification.id)}
          />
        </CardContent>
      </Card>
    </>
  );
}
