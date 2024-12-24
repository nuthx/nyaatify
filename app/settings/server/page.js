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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge"
import { Trash2Icon } from "lucide-react";

export default function ServerSettings() {
  const serverApi = "/api/settings/server";
  const serverAddApi = "/api/settings/server/add";
  const serverDeleteApi = "/api/settings/server/delete";
  const serverTestApi = "/api/settings/server/test";
  const urlPlaceholders = {
    qbittorrent: "http://192.168.1.100:8080",
    transmission: "http://192.168.1.100:9091/transmission/rpc",
    aria2: "http://192.168.1.100:6800/jsonrpc"
  };

  const { t } = useTranslation();
  const { toast } = useToast()
  const [selectedType, setSelectedType] = useState("qbittorrent");
  const [serverList, setServerList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const formSchema = z.object({
    type: z.string(),
    name: z.string()
      .min(2, { message: t("st.server.validate.name") }),
    url: z.string()
      .url({ message: t("st.server.validate.url1") })
      .startsWith("http", { message: t("st.server.validate.url2") })
      .refine(url => !url.endsWith("/"), { message: t("st.server.validate.url3") }),
    username: z.string()
      .min(1, { message: t("st.server.validate.username") }),
    password: z.string()
      .min(1, { message: t("st.server.validate.password") }),
  })

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "qbittorrent",
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
    setIsLoading(true);
    try {
      const response = await fetch(serverApi);
      const data = await response.json();
      setServerList(data.data);
    } catch (error) {
      toast({
        title: t("st.server.toast.fetch"),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
          title: t("st.server.toast.testsuccess"),
          description: t("st.server.toast.version") + data.data
        });
      } else {
        toast({
          title: t("st.server.toast.testfailed"),
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t("st.server.toast.testfailed"),
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
          title: t("st.server.toast.add"),
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t("st.server.toast.add"),
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
          title: t("st.server.toast.delete"),
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t("st.server.toast.delete"),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("st.server.add.title")}</CardTitle>
          <CardDescription>{t("st.server.add.description")}</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddServer)} className="space-y-6" noValidate>
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("st.server.add.type")}</FormLabel>
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
                        <SelectItem value="qbittorrent">qBittorrent</SelectItem>
                        <SelectItem value="transmission">Transmission</SelectItem>
                        <SelectItem value="aria2">Aria2</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("st.server.add.name")}</FormLabel>
                    <FormControl>
                      <Input className="w-72" placeholder="Server" required {...field} />
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
                    <FormLabel>{t("st.server.add.url")}</FormLabel>
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
                    <FormLabel>{t("st.server.add.username")}</FormLabel>
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
                    <FormLabel>{t("st.server.add.password")}</FormLabel>
                    <FormControl>
                      <Input className="w-72" type="password" placeholder="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit">{t("st.server.add.add")}</Button>
                <Button type="button" variant="secondary" onClick={form.handleSubmit(handleTestServer)}>{t("st.server.add.test")}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("st.server.servers.title")}</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between px-6 py-4 border-b last:border-none">
                <div className="space-y-1">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-64" />
                </div>
              </div>
            ))
          ) : serverList.length === 0 ? (
            <div className="flex items-center justify-center px-6 py-8 text-sm text-zinc-500">
              {t("st.server.servers.empty")}
            </div>
          ) : (
            serverList.map((server) => (
              <div key={server.id} className="flex items-center justify-between px-6 py-4 border-b last:border-none">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium">{server.name}</h5>
                    <Badge variant="outline">{server.type}</Badge>
                  </div>
                  <p className="text-sm text-zinc-500">{server.url}</p>
                  <p className="text-sm text-zinc-500">{t("st.server.servers.version")} 1.0</p>
                </div>
                <div className="flex space-x-4 items-center">
                  <p className="text-sm text-zinc-700 bg-zinc-100 px-3 py-2 rounded-md">{t("st.server.servers.offline")}</p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2Icon />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("st.server.servers.delete.title")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("st.server.servers.delete.description")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteServer(server.id, server.name)}>{t("common.delete")}</AlertDialogAction>
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
