"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast"
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
import { Input } from "@/components/ui/input";
import { ListCard } from "@/components/settings";

export default function ServerSettings() {
  const settingApi = "/api/settings/config";
  const settingListApi = "/api/settings/list";

  const { t } = useTranslation();
  const { toast } = useToast()
  const [serverList, setServerList] = useState([]);

  const serverFormSchema = z.object({
    type: z.string(),
    name: z.string()
      .min(2, { message: t("st.sv.validate.name1") })
      .max(40, { message: t("st.sv.validate.name2") }),
    url: z.string()
      .url({ message: t("st.sv.validate.url1") })
      .startsWith("http", { message: t("st.sv.validate.url2") })
      .refine(url => !url.endsWith("/"), { message: t("st.sv.validate.url3") }),
    username: z.string()
      .min(1, { message: t("st.sv.validate.username") }),
    password: z.string()
      .min(1, { message: t("st.sv.validate.password") }),
  })

  const serverForm = useForm({
    resolver: zodResolver(serverFormSchema),
    defaultValues: {
      type: "qBittorrent",
      name: "",
      url: "",
      username: "",
      password: ""
    },
  })

  const defaultServerForm = useForm({
    defaultValues: {
      default_server: ""
    }
  });

  const selectedType = serverForm.watch("type");
  const urlPlaceholders = {
    qBittorrent: "http://192.168.1.100:8080",
    Transmission: "http://192.168.1.100:9091/transmission/rpc",
    Aria2: "http://192.168.1.100:6800/jsonrpc"
  };

  useEffect(() => {
    fetchServer();
    fetchConfig();
  }, []);

  const fetchServer = async () => {
    try {
      const response = await fetch(`${settingListApi}?type=server`);
      const data = await response.json();
      setServerList(data.servers);
    } catch (error) {
      toast({
        title: t("st.sv.toast.fetch"),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch(settingApi);
      const data = await response.json();
      defaultServerForm.setValue("default_server", data.default_server || "");
    } catch (error) {
      toast({
        title: t("glb.toast.fetch_failed"),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleManageServer = async (action, values) => {
    const result = await handlePost(settingListApi, JSON.stringify({ type: "server", action, data: values }));
    console.log(result);
    if (result === "success") {
      if (action === "add") {
        serverForm.reset();
      }
      if (action === "test") {
        toast({
          title: t("st.sv.toast.testsuccess"),
          description: `${t("st.sv.toast.version")}: ${result.version}`
        });
      }
      fetchServer();
      fetchConfig();
    } else {
      toast({
        title: t(`st.sv.toast.${action}`),
        description: result,
        variant: "destructive"
      });
    }
  };

  const handleSaveConfig = async (values) => {
    const result = await handlePost(settingApi, JSON.stringify(values));
    if (result === "success") {
      toast({
        title: t("glb.toast.save_success")
      });
      fetchConfig();
    } else {
      toast({
        title: t("glb.toast.save_failed"),
        description: result,
        variant: "destructive"
      });
    }
  };

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
              <div className="flex gap-6">
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
              </div>
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
            items={serverList}
            empty={t("st.sv.servers.empty")}
            content={(server) => (
              <>
                <p className="text-sm text-zinc-500">{server.url}</p>
                <p className="text-sm text-zinc-500">{t("st.sv.servers.version")}: {server.version}</p>
              </>
            )}
            state={(server) => (
              <>
                {server.state === "online" ? t("st.sv.servers.online") : t("st.sv.servers.offline")}
              </>
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
          <Form {...defaultServerForm}>
            <form onSubmit={defaultServerForm.handleSubmit(handleSaveConfig)} className="space-y-6">
              <FormField control={defaultServerForm.control} name="default_server" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.sv.default.server")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={serverList.length === 0}>
                    <FormControl>
                      <SelectTrigger className="w-72">
                        <SelectValue placeholder={t("st.sv.default.empty")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serverList.map((server) => (
                        <SelectItem key={server.name} value={server.name}>
                          {server.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
                )}
              />
              <Button type="submit">{t("glb.save")}</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
