"use client";

import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { log } from "@/lib/log";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function ServerSettings() {
  const serverApi = "/api/settings/server";
  const serverAddApi = "/api/settings/server/add";

  const urlPlaceholders = {
    qbittorrent: "http://192.168.1.100:8080",
    transmission: "http://192.168.1.100:9091/transmission/rpc",
    aria2: "http://192.168.1.100:6800/jsonrpc"
  };

  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState("qbittorrent");

  const formSchema = z.object({
    type: z.string(),
    name: z.string()
      .min(2, { message: "Name must be at least 2 characters" }),
    url: z.string()
      .url({ message: "Invalid URL" })
      .startsWith("http", { message: "URL must start with http or https" }),
    username: z.string(),
    password: z.string()
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

  const handleAddServer = async (values) => {
    try {
      const response = await fetch(serverAddApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        console.log("success");
      }
    } catch (error) {
      console.error("error", error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('st.server.add.title')}</CardTitle>
          <CardDescription>{t('st.server.add.description')}</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddServer)} className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('st.server.add.type')}</FormLabel>
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
                    <FormLabel>{t('st.server.add.name')}</FormLabel>
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
                    <FormLabel>{t('st.server.add.url')}</FormLabel>
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
                    <FormLabel>{t('st.server.add.username')}</FormLabel>
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
                    <FormLabel>{t('st.server.add.password')}</FormLabel>
                    <FormControl>
                      <Input className="w-72" type="password" placeholder="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit">{t('st.server.add.add')}</Button>
                <Button>{t('st.server.add.test')}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
