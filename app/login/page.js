"use client";

import crypto from "crypto";
import Image from "next/image"
import { toast } from "sonner"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { handleRequest } from "@/lib/handlers";
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
  const loginApi = "/api/auth/login";

  const { t } = useTranslation();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const loginFrom = useForm({
    resolver: zodResolver(z.object({
      username: z.string()
        .min(1, { message: t("validate.username") }),
      password: z.string()
        .min(1, { message: t("validate.password") })
    })),
    defaultValues: {
      username: "",
      password: ""
    },
  })

  const handleLogin = async (values) => {
    const hashedPassword = crypto.createHash("sha256").update(values.password).digest("hex");
    const result = await handleRequest("POST", loginApi, JSON.stringify({ values: { ...values, password: hashedPassword } }));
    if (result.success) {
      router.push("/");
      router.refresh();
    } else {
      toast.error(t("toast.failed.login"), {
        description: result.message,
      });
    }
  };

  return (
    <div className="container flex mx-auto max-w-screen-xl min-h-[calc(100vh-72px)]">
      <div className="flex-1 hidden lg:flex items-center justify-center">
        <Image src="/login.png" alt="Login image" className="dark:grayscale dark:invert dark:opacity-90" width={380} height={380} priority />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col gap-10 pt-10">
            <h1 className="text-2xl font-bold text-center">Welcome!<br />Login to Nyaatify</h1>
            <Form {...loginFrom}>
              <form onSubmit={loginFrom.handleSubmit((values) => handleLogin(values))} className="space-y-6" noValidate>
                <FormField control={loginFrom.control} name="username" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("st.dl.add.username")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />
                <FormField control={loginFrom.control} name="password" render={({ field }) => (
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
