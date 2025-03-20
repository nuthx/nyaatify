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
import { ListCard } from "@/components/listcard";
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
          <VariableItem name="title_raw" description={t("st.nt.variable.title_raw")} />
          <VariableItem name="title_jp" description={t("st.nt.variable.title_jp")} />
          <VariableItem name="title_cn" description={t("st.nt.variable.title_cn")} />
          <VariableItem name="title_en" description={t("st.nt.variable.title_en")} />
          <VariableItem name="title_romaji" description={t("st.nt.variable.title_romaji")} />
          <VariableItem name="torrent_link" description={t("st.nt.variable.torrent_link")} />
          <VariableItem name="torrent_hash" description={t("st.nt.variable.torrent_hash")} />
          <VariableItem name="torrent_size" description={t("st.nt.variable.torrent_size")} />
          <VariableItem name="cover_anilist" description={t("st.nt.variable.cover_anilist")} />
          <VariableItem name="cover_bangumi" description={t("st.nt.variable.cover_bangumi")} />
          <VariableItem name="page_anilist" description={t("st.nt.variable.page_anilist")} />
          <VariableItem name="page_bangumi" description={t("st.nt.variable.page_bangumi")} />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function NotificationSettings() {
  const { t } = useTranslation();

  const notificationForm = createForm({
    name: { schema: "name" },
    filter: { schema: "trim" },
    type: { schema: "trim", default: "Bark" },
    url: { schema: "url", default: "https://api.day.app" },
    token: { schema: "required" },
    title: { schema: "required" },
    message: { schema: "required" },
    extra: { schema: "trim" }
  })();

  const selectedType = notificationForm.watch("type");
  const urlPlaceholders = {
    Bark: "https://api.day.app",
    Gotify: "https://your-server.com",
    ServerChan: "https://sctapi.ftqq.com",
  };

  const { data: notificationData, isLoading: notificationLoading, mutate: mutateNotification } = useData(API.NOTIFICATION, t("toast.failed.fetch_list"));

  // Set page title
  useEffect(() => {
    document.title = `${t("st.metadata.notification")} - Nyaatify`;
  }, [t]);

  // Set default url for notification type
  useEffect(() => {
    const defaultUrls = {
      Bark: "https://api.day.app",
      Gotify: "",
      ServerChan: "https://sctapi.ftqq.com"
    };
    notificationForm.setValue("url", defaultUrls[selectedType]);
  }, [selectedType]);

  const handleAdd = async (values) => {
    const result = await handleRequest("POST", API.NOTIFICATION, values, t("toast.failed.add"));
    if (result) {
      notificationForm.reset();
      mutateNotification();
    }
  };

  const handleDelete = async (id) => {
    const result = await handleRequest("DELETE", `${API.NOTIFICATION}/${id}`, null, t("toast.failed.delete"));
    if (result) {
      mutateNotification();
    }
  };

  const handleEdit = async (id, values) => {
    const result = await handleRequest("PATCH", `${API.NOTIFICATION}/${id}`, values, t("toast.failed.edit"));
    if (result) {
      mutateNotification();
    }
  };

  const handleTest = async (values) => {
    const result = await handleRequest("POST", `${API.NOTIFICATION}/test`, values, t("toast.failed.send"));
    if (result) {
      toast(t("toast.done.send"));
    }
  };

  if (notificationLoading) {
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
          <Form {...notificationForm}>
            <form onSubmit={notificationForm.handleSubmit((values) => handleAdd(values))} className="space-y-6" noValidate>
              <FormField control={notificationForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.nt.add.name")}</FormLabel>
                  <FormControl>
                    <Input className="w-72" placeholder="Notification" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={notificationForm.control} name="filter" render={({ field }) => (
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
              <FormField control={notificationForm.control} name="type" render={({ field }) => (
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
              <FormField control={notificationForm.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.nt.add.url")}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder={urlPlaceholders[selectedType]} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={notificationForm.control} name="token" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.nt.add.token")}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder="Token" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={notificationForm.control} name="title" render={({ field }) => (
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
              <FormField control={notificationForm.control} name="message" render={({ field }) => (
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
              <FormField control={notificationForm.control} name="extra" render={({ field }) => (
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
                <Button type="button" variant="outline" onClick={notificationForm.handleSubmit((values) => handleTest(values))}>{t("glb.test")}</Button>
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
