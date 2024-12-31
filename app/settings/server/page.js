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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ListCard } from "@/components/settings";

export default function ServerSettings() {
  const serverApi = "/api/settings/server";
  const serverAddApi = "/api/settings/server/add";
  const serverDeleteApi = "/api/settings/server/delete";
  const serverTestApi = "/api/settings/server/test";
  const urlPlaceholders = {
    qBittorrent: "http://192.168.1.100:8080",
    Transmission: "http://192.168.1.100:9091/transmission/rpc",
    Aria2: "http://192.168.1.100:6800/jsonrpc"
  };

  const { t } = useTranslation();
  const { toast } = useToast()
  const [selectedType, setSelectedType] = useState("qBittorrent");
  const [serverList, setServerList] = useState([]);

  const formSchema = z.object({
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

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "qBittorrent",
      name: "",
      url: "",
      username: "",
      password: ""
    },
  })

  useEffect(() => {
    fetchServer();
  }, []);

  const fetchServer = async () => {
    try {
      const response = await fetch(serverApi);
      const data = await response.json();
      setServerList(data.data);
    } catch (error) {
      toast({
        title: t("st.sv.toast.fetch"),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleTestServer = async (values) => {
    try {
      const response = await fetch(serverTestApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: t("st.sv.toast.testsuccess"),
          description: `${t("st.sv.toast.version")}: ${data.data}`
        });
      } else {
        toast({
          title: t("st.sv.toast.testfailed"),
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t("st.sv.toast.testfailed"),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleAddServer = async (values) => {
    try {
      const response = await fetch(serverAddApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        form.reset();
        fetchServer();
      } else {
        toast({
          title: t("st.sv.toast.add"),
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t("st.sv.toast.add"),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteServer = async (id, name) => {
    try {
      const response = await fetch(serverDeleteApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });

      const data = await response.json();

      if (response.ok) {
        fetchServer();
      } else {
        toast({
          title: t("st.sv.toast.delete"),
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t("st.sv.toast.delete"),
        description: error.message,
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddServer)} className="space-y-6" noValidate>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("st.sv.add.name")}</FormLabel>
                    <FormControl>
                      <Input className="w-72" placeholder="Server" required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("st.sv.add.type")}</FormLabel>
                    <Select 
                      defaultValue={field.value} 
                      onValueChange={(value) => {
                        field.onChange(value); 
                        setSelectedType(value);
                      }}
                    >
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("st.sv.add.url")}</FormLabel>
                    <FormControl>
                      <Input className="w-full" placeholder={urlPlaceholders[selectedType]} required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("st.sv.add.username")}</FormLabel>
                    <FormControl>
                      <Input className="w-72" placeholder="admin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password" 
                render={({ field }) => (
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
                <Button type="submit">{t("st.sv.add.add")}</Button>
                <Button type="button" variant="outline" onClick={form.handleSubmit(handleTestServer)}>{t("st.sv.add.test")}</Button>
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
            onDelete={handleDeleteServer}
            deleteable={() => true}
            deleteDescription={t("st.sv.servers.alert")}
          />
        </CardContent>
      </Card>
    </>
  );
}
