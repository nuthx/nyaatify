"use client";

import crypto from "crypto";
import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { handleRequest } from "@/lib/handlers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Eye, EyeOff } from "lucide-react"

export default function Devices() {
  const deviceApi = "/api/user/device";
  const usernameApi = "/api/user/username";
  const passwordApi = "/api/user/password";

  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const passwordFrom = useForm({
    resolver: zodResolver(z.object({
      current_password: z.string()
        .min(1, { message: t("validate.password") }),
      new_password: z.string()
        .min(1, { message: t("validate.password") })
    })),
    defaultValues: {
      current_password: "",
      new_password: ""
    },
  })

  const { data, error, isLoading } = useSWR(deviceApi, async (url) => {
    const response = await fetch(url);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }
    return result.data;
  });

  useEffect(() => {
    if (error) {
      toast.error(t("toast.failed.fetch_devices"), {
        description: error.message,
      });
    }
  }, [error]);

  const handlePassword = async (values) => {
    const hashedPassword = crypto.createHash("sha256").update(values.new_password).digest("hex");
    const result = await handleRequest("PATCH", passwordApi, JSON.stringify({ values: { ...values, new_password: hashedPassword } }));
    if (result.success) {
      passwordFrom.reset();
      toast(t("toast.success.edit"));
    } else {
      toast.error(t("toast.failed.edit"), {
        description: result.message,
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await handleRequest("DELETE", `${deviceApi}/${id}`);
    if (result.success) {
      mutate(deviceApi);
    } else {
      toast.error(t("toast.failed.delete"), {
        description: result.message,
      });
    }
  };

  if (isLoading) {
    return <></>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("st.user.password.title")}</CardTitle>
          <CardDescription>{t("st.user.password.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordFrom}>
            <form onSubmit={passwordFrom.handleSubmit((values) => handlePassword(values))} className="space-y-6" noValidate>
              <FormField control={passwordFrom.control} name="current_password" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.user.password.current")}</FormLabel>
                  <FormControl>
                    <Input className="w-72" placeholder="********" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={passwordFrom.control} name="new_password" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.user.password.new")}</FormLabel>
                  <FormControl>
                    <div className="relative w-72">
                      <Input placeholder="********" type={showPassword ? "text" : "password"} {...field} />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-primary/50" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <Button type="submit">{t("glb.save")}</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("st.user.devices.title")}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-2 py-4">{t("st.user.devices.os")}</TableHead>
                <TableHead className="px-2 py-4">{t("st.user.devices.browser")}</TableHead>
                <TableHead className="px-2 py-4">{t("st.user.devices.ip")}</TableHead>
                <TableHead className="px-2 py-4">{t("st.user.devices.last")}</TableHead>
                <TableHead className="px-3 py-4 w-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.devices.map((device) => (
                <TableRow key={device.id} className="hover:bg-transparent">
                  <TableCell className="px-2 py-4">{device.os}</TableCell>
                  <TableCell className="px-2 py-4">{device.browser}</TableCell>
                  <TableCell className="px-2 py-4">{device.ip}</TableCell>
                  <TableCell className="px-2 py-4">
                    {data.current_device === device.id ? (
                      t("st.user.devices.current")
                    ) : (
                      new Date(device.last_used_at).toLocaleString()
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-4 w-4">
                    <Button variant="ghost" size="icon" disabled={data.current_device === device.id} onClick={() => handleDelete(device.id)}>
                      <Trash2 className="text-muted-foreground"/>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
