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
  const { t } = useTranslation();

  const downloaderForm = createForm({
    type: { schema: "trim", default: "qBittorrent" },
    name: { schema: "name" },
    url: { schema: "url" },
    username: { schema: "username" },
    password: { schema: "password" }
  })();

  const selectedType = downloaderForm.watch("type");
  const urlPlaceholders = {
    qBittorrent: "http://192.168.1.100:8080",
    Transmission: "http://192.168.1.100:9091/transmission/rpc",
    Aria2: "http://192.168.1.100:6800/jsonrpc"
  };

  const { data: downloaderData, isLoading: downloaderLoading, mutate: mutateDownloader } = useData(API.DOWNLOADER, t("toast.failed.fetch_list"));
  const { data: configData, isLoading: configLoading, mutate: mutateConfig } = useData(API.CONFIG, t("toast.failed.fetch_config"));

  // Set page title
  useEffect(() => {
    document.title = `${t("st.metadata.downloader")} - Nyaatify`;
  }, [t]);

  const handleAdd = async (values) => {
    const result = await handleRequest("POST", API.DOWNLOADER, values, t("toast.failed.add"));
    if (result) {
      downloaderForm.reset();
      mutateDownloader();
      mutateConfig();
    }
  };

  const handleDelete = async (id) => {
    const result = await handleRequest("DELETE", `${API.DOWNLOADER}/${id}`, null, t("toast.failed.delete"));
    if (result) {
      mutateDownloader();
      mutateConfig();
    }
  };

  const handleTest = async (values) => {
    const result = await handleRequest("POST", `${API.DOWNLOADER}/test`, values, t("toast.failed.test"));
    if (result) {
      toast.success(t("toast.success.test"), {
        description: `${t("glb.version")}: ${result.data.version}`
      });
    }
  };

  const handleSaveConfig = async (values) => {
    const result = await handleRequest("PATCH", API.CONFIG, values, t("toast.failed.save"));
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
                    <Input className="w-full lg:w-72 transition-width duration-300 ease-in-out" placeholder="Downloader" {...field} />
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
                      <SelectTrigger className="w-full lg:w-72 transition-width duration-300 ease-in-out">
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
                    <Input className="w-full lg:w-72 transition-width duration-300 ease-in-out" placeholder="admin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={downloaderForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.dl.add.password")}</FormLabel>
                  <FormControl>
                    <Input className="w-full lg:w-72 transition-width duration-300 ease-in-out" type="password" placeholder="password" {...field} />
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
                <p className="text-sm text-muted-foreground break-all">{downloader.url}</p>
                <p className="text-sm text-muted-foreground break-all">{t("glb.version")}: {downloader.version}</p>
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
            <SelectTrigger className="w-full lg:w-72 transition-width duration-300 ease-in-out">
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

      <Card>
        <CardHeader>
          <CardTitle>{t("st.dl.state.title")}</CardTitle>
          <CardDescription>{t("st.dl.state.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select defaultValue={configData?.downloaderStateDisplay || "1"} onValueChange={(value) => handleSaveConfig({ downloaderStateDisplay: value })}>
            <SelectTrigger className="w-full lg:w-72 transition-width duration-300 ease-in-out">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t("glb.show")}</SelectItem>
              <SelectItem value="0">{t("glb.hide")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </>
  );
}
