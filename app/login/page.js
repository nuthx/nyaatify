"use client";

import crypto from "crypto";
import Image from "next/image"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { API } from "@/lib/http/api";
import { useData } from "@/lib/http/swr";
import { handleRequest } from "@/lib/http/request";
import { createForm } from "@/lib/form";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { NyaatifyInfo } from "@/components/nyaatify-info";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const loginForm = createForm({
    username: { schema: "username" },
    password: { schema: "password" }
  })();

  const { data: coverData, error: coverError, isLoading: coverLoading } = useData(API.LOGIN_COVER, t("toast.failed.fetch_cover"), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  // Set page title
  useEffect(() => {
    document.title = `${t("glb.login")} - Nyaatify`;
  }, [t]);

  const handleLogin = async (values) => {
    const hashedPassword = crypto.createHash("sha256").update(values.password).digest("hex");
    const result = await handleRequest("POST", API.LOGIN, { ...values, password: hashedPassword }, t("toast.failed.login"));
    if (result) {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-svh p-6 md:p-10">
      <Card className="overflow-hidden w-full max-w-sm md:max-w-3xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit((values) => handleLogin(values))} className="p-6 md:px-8 md:py-10">
              <div className="flex flex-col gap-5 h-full">
                <NyaatifyInfo className="flex-1 justify-center my-4" />
                <FormField control={loginForm.control} name="username" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("st.dl.add.username")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={loginForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("st.dl.add.password")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} {...field} />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-primary/50" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full mt-2">{t("glb.login")}</Button>
              </div>
            </form>
          </Form>
          <div className="relative hidden md:block h-[540px] bg-primary/5 dark:bg-accent">
            {!coverLoading && !coverError && (
              <Image
                src={coverData?.coverBangumi}
                alt="Anime cover"
                fill
                className={`object-cover transition duration-700 ease-in-out ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                priority
                onLoad={() => setImageLoaded(true)}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
