"use client";

import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { handlePost, handleRequest } from "@/lib/handlers";
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
import { RefreshCw } from "lucide-react";

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
      token: z.string(),
      title: z.string(),
      message: z.string(),
      extra: z.string()
    })),
    defaultValues: {
      name: "",
      trigger: "NewAnimeRelease",
      condition: "",
      type: "Bark",
      url: "",
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
    const result = await handleRequest("POST", `${notificationApi}/test`, JSON.stringify({ values }));
    if (result.success) {
      toast.success(t("toast.success.test"));
    } else {
      toast.error(t("toast.failed.test_notification"), {
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
          <CardTitle>添加新的通知</CardTitle>
          <CardDescription>添加一个消息推送服务，用于在指定条件触发时接受通知</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...notificationFrom}>
            <form onSubmit={notificationFrom.handleSubmit((values) => handleAdd(values))} className="space-y-6" noValidate>
              <FormField control={notificationFrom.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>名称</FormLabel>
                  <FormControl>
                    <Input className="w-72" placeholder="Notification" required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="trigger" render={({ field }) => (
                <FormItem>
                  <FormLabel>触发条件</FormLabel>
                  <Select defaultValue={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-72">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NewAnimeRelease">订阅更新时</SelectItem>
                      <SelectItem value="DownloadFinished">下载完成时</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="condition" render={({ field }) => (
                <FormItem>
                  <FormLabel>包含项目（可选）</FormLabel>
                  <FormControl>
                    <Input className="w-72" placeholder="name1, name2" required {...field} />
                  </FormControl>
                  <FormMessage className="font-normal text-muted-foreground">
                    填写后则仅接收指定项目的通知，多个项目使用英文逗号分隔。默认接收所有通知
                  </FormMessage>
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>推送服务</FormLabel>
                  <Select defaultValue={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-72">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Bark">Bark</SelectItem>
                      <SelectItem value="Gotify">Gotify</SelectItem>
                      <SelectItem value="ServerChan">ServerChan</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="font-normal text-muted-foreground">
                    {selectedType === "Bark" && <a href="https://bark.day.app/#/tutorial" target="_blank" className="hover:underline">查看使用文档</a>}
                    {selectedType === "Gotify" && <a href="https://gotify.net/docs/pushmsg" target="_blank" className="hover:underline">查看使用文档</a>}
                    {selectedType === "ServerChan" && <a href="https://sct.ftqq.com/sendkey" target="_blank" className="hover:underline">查看使用文档</a>}
                  </FormMessage>
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel>推送地址</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder={urlPlaceholders[selectedType]} required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="token" render={({ field }) => (
                <FormItem>
                  <FormLabel>Token</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder="Token" required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>标题</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder="Title" required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>内容</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder="Message" required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={notificationFrom.control} name="extra" render={({ field }) => (
                <FormItem>
                  <FormLabel>额外参数（可选）</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder="icon=https://example.com/icon.png&sound=default" required {...field} />
                  </FormControl>
                  <FormMessage className="font-normal text-muted-foreground">
                    添加额外参数后将在 POST 请求中一并发送，多个参数使用 & 分隔
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
          <CardTitle>通知列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ListCard
            items={notificationData?.notification || []}
            empty={"请先添加一个通知"}
            content={(notification) => (
              <>
                <p className="text-sm text-muted-foreground">{notification.url}</p>
                <p className="text-sm text-muted-foreground">{notification.token}</p>
              </>
            )}
            state={(notification) => (
              notification.trigger === "NewAnimeRelease" ? (
                <>订阅更新时</>
              ) : (
                <>下载完成时</>
              )
            )}
            menu={(notification) => (
              <>
                <DropdownMenuItem onClick={() => handleManageNotification("refresh", notification)}>
                  <RefreshCw />{t("st.rss.subscription.refresh")}
                </DropdownMenuItem>
              </>
            )}
            onDelete={(notification) => handleDelete(notification.name)}
            deleteable={() => true}
            deleteDescription={"删除后无法恢复，请谨慎操作"}
          />
        </CardContent>
      </Card>
    </>
  );
}
