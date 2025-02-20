"use client";

import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export default function Devices() {
  const deviceApi = "/api/user/device";

  const { t } = useTranslation();

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
          <CardTitle>已登录设备</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-2 py-4">操作系统</TableHead>
                <TableHead className="px-2 py-4">浏览器</TableHead>
                <TableHead className="px-2 py-4">IP 地址</TableHead>
                <TableHead className="px-2 py-4">最后使用</TableHead>
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
                      "当前设备"
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
