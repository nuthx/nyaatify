"use client";

import crypto from "crypto";
import { toast } from "sonner"
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API } from "@/lib/http/api";
import { useData } from "@/lib/http/swr";
import { handleRequest } from "@/lib/http/request";
import { createForm } from "@/lib/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Eye, EyeOff } from "lucide-react"

export default function Devices() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const usernameForm = createForm({
    new_username: { schema: "username" }
  })();

  const passwordForm = createForm({
    current_password: { schema: "password" },
    new_password: { schema: "password8" }
  })();

  const { data: usernameData, isLoading: usernameLoading, mutate: usernameMutate } = useData(API.USERNAME, t("toast.failed.fetch_config"));
  const { data: deviceData, isLoading: deviceLoading } = useData(API.DEVICE, t("toast.failed.fetch_config"));

  // Set page title
  useEffect(() => {
    document.title = `${t("st.metadata.user")} - Nyaatify`;
  }, [t]);

  useEffect(() => {
    if (usernameData?.username) {
      usernameForm.setValue("new_username", usernameData.username);
    }
  }, [usernameData]);

  const handleUsername = async (values) => {
    const result = await handleRequest("PATCH", API.USERNAME, values, t("toast.failed.edit"));
    if (result) {
      usernameMutate();
      toast(t("toast.success.edit"));
    }
  };

  const handlePassword = async (values) => {
    const hashedCurPw = crypto.createHash("sha256").update(values.current_password).digest("hex");
    const hashedNewPw = crypto.createHash("sha256").update(values.new_password).digest("hex");
    const result = await handleRequest("PATCH", API.PASSWORD, { cur_password: hashedCurPw, new_password: hashedNewPw }, t("toast.failed.edit"));
    if (result) {
      passwordForm.reset();
      toast(t("toast.success.edit"));
    }
  };

  if (usernameLoading || deviceLoading) {
    return <></>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("st.user.username.title")}</CardTitle>
          <CardDescription>{t("st.user.username.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...usernameForm}>
            <form onSubmit={usernameForm.handleSubmit((values) => handleUsername(values))} className="space-y-6" noValidate>
              <FormField control={usernameForm.control} name="new_username" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.dl.add.username")}</FormLabel>
                  <FormControl>
                    <Input className="w-full lg:w-72 transition-width duration-300 ease-in-out" placeholder={usernameData?.username || "username"} {...field} />
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
          <CardTitle>{t("st.user.password.title")}</CardTitle>
          <CardDescription>{t("st.user.password.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit((values) => handlePassword(values))} className="space-y-6" noValidate>
              <FormField control={passwordForm.control} name="current_password" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.user.password.current")}</FormLabel>
                  <FormControl>
                    <Input className="w-full lg:w-72 transition-width duration-300 ease-in-out" placeholder="********" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              />
              <FormField control={passwordForm.control} name="new_password" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("st.user.password.new")}</FormLabel>
                  <FormControl>
                    <div className="relative w-full lg:w-72 transition-width duration-300 ease-in-out">
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
                <TableHead className="px-2 py-4">{t("st.user.devices.created")}</TableHead>
                <TableHead className="px-2 py-4">{t("st.user.devices.expired")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deviceData?.devices.map((device) => (
                <TableRow key={device.id} className="hover:bg-transparent">
                  <TableCell className="px-2 py-4">{device.os}</TableCell>
                  <TableCell className="px-2 py-4">
                    <div className="flex items-center gap-2">
                      {device.browser}
                      {deviceData.currentDevice === device.id && (
                        <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-4">{device.ip}</TableCell>
                  <TableCell className="px-2 py-4">{new Date(device.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="px-2 py-4">{new Date(device.expiredAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
