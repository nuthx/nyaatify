"use client";

import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import { useEffect } from "react";
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

export default function ServerSettings() {
  const serversApi = "/api/servers";
  const configApi = "/api/config";

  const { t } = useTranslation();

  const serverForm = useForm({
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

  const selectedType = serverForm.watch("type");
  const urlPlaceholders = {
    qBittorrent: "http://192.168.1.100:8080",
    Transmission: "http://192.168.1.100:9091/transmission/rpc",
    Aria2: "http://192.168.1.100:6800/jsonrpc"
  };

  const fetcher = async (url) => {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error);
    }
    return data;
  };

  const { data: configData, error: configError, isLoading: configLoading } = useSWR(configApi, fetcher);
  const { data: serverData, error: serverError, isLoading: serverLoading } = useSWR(serversApi, fetcher);

  useEffect(() => {
    if (serverError) {
      toast.error(t("toast.failed.fetch_server"), {
        description: serverError.message,
      });
    }
    if (configError) {
      toast.error(t("toast.failed.fetch_config"), {
        description: configError.message,
      });
    }
  }, [serverError, configError]);

  const handleManageServer = async (action, values) => {
    const result = await handlePost(serversApi, JSON.stringify({ type: "server", action, data: values }));
    if (result.state === "success") {
      if (action === "add") {
        serverForm.reset();
      }
      if (action === "test") {
        toast.success(t("toast.success.test"), {
          description: `${t("glb.version")}: ${result.message.version}`
        });
      }
      mutate(serversApi);
      mutate(configApi);
    } else {
      toast.error(t(`toast.failed.${action}_server`), {
        description: result.message,
      });
    }
  };

  const handleSaveConfig = async (values) => {
    const result = await handlePost(configApi, JSON.stringify(values));
    if (result.state === "success") {
      toast(t("toast.success.save"));
      mutate(configApi);
    } else {
      toast.error(t("toast.failed.save"), {
        description: result.message,
      });
    }
  };

  if (serverLoading || configLoading) {
    return <></>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("st.sv.add.title")}</CardTitle>
          <CardDescription>{t("st.sv.add.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...serverForm}>
            <form onSubmit={serverForm.handleSubmit((values) => handleManageServer("add", values))} className="space-y-6" noValidate>
              <FormField control={serverForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.sv.add.name")}</FormLabel>
                  <FormControl>
                    <Input className="w-72" placeholder="Server" required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={serverForm.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.sv.add.type")}</FormLabel>
                  <Select defaultValue={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-72">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="qBittorrent">qBittorrent</SelectItem>
                      <SelectItem value="Transmission">Transmission</SelectItem>
                      <SelectItem value="Aria2">Aria2</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="font-normal text-zinc-500">
                    {selectedType === "qBittorrent" && t("st.sv.add.type_notice_qb")}
                    {selectedType === "Transmission" && t("st.sv.add.type_notice_tr")}
                    {selectedType === "Aria2" && t("st.sv.add.type_notice_ar")}
                  </FormMessage>
                </FormItem>
              )}
              />
              <FormField control={serverForm.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.sv.add.url")}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder={urlPlaceholders[selectedType]} required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={serverForm.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.sv.add.username")}</FormLabel>
                  <FormControl>
                    <Input className="w-72" placeholder="admin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={serverForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.sv.add.password")}</FormLabel>
                  <FormControl>
                    <Input className="w-72" type="password" placeholder="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <div className="flex gap-2">
                <Button type="submit">{t("glb.add")}</Button>
                <Button type="button" variant="outline" onClick={serverForm.handleSubmit((values) => handleManageServer("test", values))}>{t("glb.test")}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("st.sv.servers.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ListCard
            items={serverData?.servers || []}
            empty={t("st.sv.servers.empty")}
            content={(server) => (
              <>
                <p className="text-sm text-zinc-500">{server.url}</p>
                <p className="text-sm text-zinc-500">{t("glb.version")}: {server.version}</p>
              </>
            )}
            state={(server) => (
              <>
                {server.state === "online" ? t("st.sv.servers.online") : t("st.sv.servers.offline")}
              </>
            )}
            menu={(server) => (
              <></>
            )}
            onDelete={(server) => handleManageServer("delete", server)}
            deleteable={() => true}
            deleteDescription={t("st.sv.servers.alert")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("st.sv.default.title")}</CardTitle>
          <CardDescription>{t("st.sv.default.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select defaultValue={serverData?.default_server} onValueChange={(value) => handleSaveConfig({ default_server: value })} disabled={!serverData?.servers?.length}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder={t("st.sv.default.empty")} />
            </SelectTrigger>
            <SelectContent>
              {(serverData?.servers || []).map((server) => (
                <SelectItem key={server.name} value={server.name}>
                  {server.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </>
  );
}
