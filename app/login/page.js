"use client";

import crypto from "crypto";
import Image from "next/image"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { API } from "@/lib/http/api";
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
} from "@/components/ui/form"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = createForm({
    username: { schema: "username" },
    password: { schema: "password" }
  })();

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
    <div className="container flex mx-auto max-w-screen-xl min-h-[calc(100vh-72px)]">
      <div className="flex-1 hidden lg:flex items-center justify-center">
        <Image src="/images/login.png" alt="Login image" className="dark:grayscale dark:invert dark:opacity-90" width={380} height={380} priority />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col gap-10 pt-10">
            <h1 className="text-2xl font-bold text-center">Welcome!<br />Login to Nyaatify</h1>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit((values) => handleLogin(values))} className="space-y-6" noValidate>
                <FormField control={loginForm.control} name="username" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("st.dl.add.username")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />
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
                )}
                />
                <div className="pt-2">
                  <Button type="submit" className="w-full">{t("glb.login")}</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
