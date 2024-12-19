"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2Icon } from "lucide-react";

const rssApi = "/api/settings/rss";
const rssAddApi = "/api/settings/rss/add";
const rssDeleteApi = "/api/settings/rss/delete";

const formSchema = z.object({
  name: z.string()
    .min(2, { message: "Name must be at least 2 characters" }),
  url: z.string()
    .url({ message: "Invalid URL" })
    .startsWith("http", { message: "URL must start with http or https" }),
  interval: z.coerce
    .number()
    .int({ message: "Interval must be a whole number" })
    .min(3, { message: "Update interval must be at least 3 minutes" })
})

export default function RSSSettings() {
  const [rssList, setRSSList] = useState([]);
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      url: "",
      interval: 5,
    },
  })

  useEffect(() => {
    fetchRSS();
  }, []);

  const fetchRSS = async () => {
    try {
      const response = await fetch(rssApi);
      const data = await response.json();
      setRSSList(data.data);
    } catch (error) {
      log.error("Failed to fetch RSS:", error);
    }
  };

  const handleAddRSS = async (values) => {
    try {
      const response = await fetch(rssAddApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        form.reset();
        fetchRSS();
      }
    } catch (error) {
      log.error("Failed to add RSS:", error);
    }
  };

  const handleDeleteRSS = async (id) => {
    try {
      await fetch(`${rssDeleteApi}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      fetchRSS();
    } catch (error) {
      log.error("Failed to delete RSS:", error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Add a New RSS Subscription</CardTitle>
          <CardDescription>Before you start, you have to add at least one RSS subscription.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddRSS)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input className="w-72" placeholder="Nyaatify" required {...field} />
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
                    <FormLabel>RSS URL</FormLabel>
                    <FormControl>
                      <Input className="w-full" placeholder="https://nyaa.si/?page=rss" required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Update Interval (minutes)</FormLabel>
                    <FormControl>
                      <Input className="w-72" type="number" min="3" required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Add</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>RSS Subscription</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {rssList.map((rss) => (
            <div key={rss.id} className="flex items-center justify-between px-6 py-4 border-b last:border-none">
              <div className="space-y-1">
                <h5 className="font-medium">{rss.name}</h5>
                <p className="text-sm text-zinc-500">{rss.url}</p>
              </div>
              <div className="flex space-x-6 items-center">
                <p className="text-sm text-zinc-700 bg-zinc-100 px-3 py-2 rounded-md">{rss.interval} min</p>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteRSS(rss.id)}>
                  <Trash2Icon />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
