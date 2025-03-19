"use client";

import { toast } from "sonner"
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
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
  FormDescription,
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
import { ListCard } from "@/components/listcard";

export default function DownloaderSettings() {
  const downloadersApi = "/api/downloaders";
  const configApi = "/api/configs";

  const { t } = useTranslation();

  const downloaderForm = useForm({
    resolver: zodResolver(z.object({
      type: z.string(),
      name: z.string()
        .min(2, { message: t("validate.name_2") })
        .max(40, { message: t("validate.name_40") }),
      url: z.string()
        .url({ message: t("validate.url_invalid") })
        .startsWith("http", { message: t("validate.url_http") })
        .refine(url => !url.endsWith("/"), { message: t("validate.url_slash") }),
      username: z.string()
        .min(1, { message: t("validate.username") }),
      password: z.string()
        .min(1, { message: t("validate.password") }),
    })),
    defaultValues: {
      type: "qBittorrent",
      name: "",
      url: "",
      username: "",
      password: ""
    },
  })

  const selectedType = downloaderForm.watch("type");
  const urlPlaceholders = {
    qBittorrent: "http://192.168.1.100:8080",
    Transmission: "http://192.168.1.100:9091/transmission/rpc",
    Aria2: "http://192.168.1.100:6800/jsonrpc"
  };

  const { data: downloaderData, isLoading: downloaderLoading, mutate: mutateDownloader } = useData(downloadersApi, t("toast.failed.fetch_list"));
  const { data: configData, isLoading: configLoading, mutate: mutateConfig } = useData(configApi, t("toast.failed.fetch_config"));

  // Set page title
  useEffect(() => {
    document.title = `${t("st.metadata.downloader")} - Nyaatify`;
  }, [t]);

  const handleAdd = async (values) => {
    const result = await handleRequest("POST", downloadersApi, values, t("toast.failed.add"));
    if (result) {
      downloaderForm.reset();
      mutateDownloader();
      mutateConfig();
    }
  };

  const handleDelete = async (id) => {
    const result = await handleRequest("DELETE", `${downloadersApi}/${id}`, null, t("toast.failed.delete"));
    if (result) {
      mutateDownloader();
      mutateConfig();
    }
  };

  const handleTest = async (values) => {
    const result = await handleRequest("POST", `${downloadersApi}/test`, values, t("toast.failed.test"));
    if (result) {
      toast.success(t("toast.success.test"), {
        description: `${t("glb.version")}: ${result.data.version}`
      });
    }
  };

  const handleSaveConfig = async (values) => {
    const result = await handleRequest("PATCH", configApi, values, t("toast.failed.save"));
    if (result) {
      toast(t("toast.success.save"));
      mutateConfig();
    }
  };

  if (downloaderLoading || configLoading) {
    return <></>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("st.dl.add.title")}</CardTitle>
          <CardDescription>{t("st.dl.add.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...downloaderForm}>
            <form onSubmit={downloaderForm.handleSubmit((values) => handleAdd(values))} className="space-y-6" noValidate>
              <FormField control={downloaderForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.dl.add.name")}</FormLabel>
                  <FormControl>
                    <Input className="w-72" placeholder="Downloader" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={downloaderForm.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.dl.add.type")}</FormLabel>
                  <Select defaultValue={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-72">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="qBittorrent">qBittorrent</SelectItem>
                      <SelectItem value="Transmission" disabled>Transmission</SelectItem>
                      <SelectItem value="Aria2" disabled>Aria2</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  <FormDescription>
                    {selectedType === "qBittorrent" && t("st.dl.add.type_notice_qb")}
                    {selectedType === "Transmission" && t("st.dl.add.type_notice_tr")}
                    {selectedType === "Aria2" && t("st.dl.add.type_notice_ar")}
                    </FormDescription>
                </FormItem>
              )}
              />
              <FormField control={downloaderForm.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.dl.add.url")}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder={urlPlaceholders[selectedType]} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={downloaderForm.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.dl.add.username")}</FormLabel>
                  <FormControl>
                    <Input className="w-72" placeholder="admin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={downloaderForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.dl.add.password")}</FormLabel>
                  <FormControl>
                    <Input className="w-72" type="password" placeholder="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <div className="flex gap-2">
                <Button type="submit">{t("glb.add")}</Button>
                <Button type="button" variant="outline" onClick={downloaderForm.handleSubmit((values) => handleTest(values))}>{t("glb.test")}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("st.dl.list.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ListCard
            items={downloaderData?.downloaders || []}
            empty={t("st.dl.list.empty")}
            content={(downloader) => (
              <>
                <p className="text-sm text-muted-foreground">{downloader.url}</p>
                <p className="text-sm text-muted-foreground">{t("glb.version")}: {downloader.version}</p>
              </>
            )}
            state={(downloader) => (
              <>
                {downloader.state === "online" ? t("st.dl.list.online") : t("st.dl.list.offline")}
              </>
            )}
            menu={(downloader) => (
              <></>
            )}
            deleteable={() => true}
            deleteDesc={t("st.dl.list.alert")}
            onDelete={(downloader) => handleDelete(downloader.id)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("st.dl.default.title")}</CardTitle>
          <CardDescription>{t("st.dl.default.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={configData?.defaultDownloader} onValueChange={(value) => handleSaveConfig({ defaultDownloader: value })} disabled={!downloaderData?.downloaders?.length}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder={t("st.dl.default.empty")} />
            </SelectTrigger>
            <SelectContent>
              {(downloaderData?.downloaders || []).map((downloader) => (
                <SelectItem key={downloader.name} value={downloader.name}>
                  {downloader.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </>
  );
}
