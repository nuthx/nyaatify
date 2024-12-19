"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const serverApi = "/api/settings/server";
const serverEditApi = "/api/settings/server/edit";

export default function ServerSettings() {
  const [serverConfig, setServerConfig] = useState({
    type: "",
    url: "",
    username: "",
    password: ""
  });

  useEffect(() => {
    const fetchServerConfig = async () => {
      try {
        const response = await fetch(serverApi);
        if (response.ok) {
          const data = await response.json();
          if (data.code === 200 && data.data.length > 0) {
            const config = data.data[0];
            setServerConfig({
              type: config.type || "",
              url: config.url || "",
              username: config.username || "",
              password: config.password || ""
            });
          }
        }
      } catch (error) {
        console.error("error", error);
      }
    };

    fetchServerConfig();
  }, []);

  const handleServerConfig = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(serverEditApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serverConfig),
      });
      
      if (response.ok) {
        console.log("success");
      }
    } catch (error) {
      console.error("error", error);
    }
  };

  return (
    <div className="space-y-6">

      <form onSubmit={handleServerConfig} className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="server-url">Server URL</Label>
          <Input
            type="text"
            id="server-url"
            value={serverConfig.url}
            onChange={(e) => setServerConfig({...serverConfig, url: e.target.value})}
            placeholder="https://www.example.com:8080"
            required
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            type="text"
            id="username"
            value={serverConfig.username}
            onChange={(e) => setServerConfig({...serverConfig, username: e.target.value})}
            placeholder="admin"
            required
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            id="password"
            value={serverConfig.password}
            onChange={(e) => setServerConfig({...serverConfig, password: e.target.value})}
            required
          />
        </div>
        <Button type="submit">Save Server Config</Button>
      </form>
    </div>
  );
}
