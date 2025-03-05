"use client";

import useSWR from "swr"
import { toast } from "sonner"
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { handleRequest } from "@/lib/handlers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PaginationPro } from "@/components/pagination";

export default function Logs() {
  const logsApi = "/api/logs";
  const configApi = "/api/configs";

  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [level, setLevel] = useState("all");
  const [availableDays, setAvailableDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 80;

  const fetcher = async (url) => {
    const response = await fetch(url);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }
    return result.data;
  };

  const { data: logsData, error: logsError, isLoading: logsLoading } = useSWR(selectedDate ? `${logsApi}?date=${selectedDate}` : logsApi, fetcher);
  const { data: configData, error: configError, isLoading: configLoading, mutate: mutateConfig } = useSWR(configApi, fetcher);

  // Set page title
  useEffect(() => {
    document.title = `${t("st.metadata.logs")} - Nyaatify`;
  }, [t]);

  useEffect(() => {
    if (logsError) {
      toast.error(t("toast.failed.fetch_logs"), {
        description: logsError.message,
      });
    }
    if (logsData) {
      setLogs(logsData.logs);
      setFilteredLogs(logsData.logs);
      setAvailableDays(logsData.days);
    }
  }, [logsError, logsData]);

  useEffect(() => {
    if (configError) {
      toast.error(t("toast.failed.fetch_config"), {
        description: configError.message,
      });
    }
  }, [configError]);

  useEffect(() => {
    setFilteredLogs(level === "all" ? logs : logs.filter(log => log.level === level));
    setCurrentPage(1);
  }, [level, logs]);

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const handleSaveConfig = async (values) => {
    const result = await handleRequest("PATCH", configApi, JSON.stringify(values));
    if (result.success) {
      toast(t("toast.success.save"));
      mutateConfig();
    } else {
      toast.error(t("toast.failed.save"), {
        description: result.message,
      })
    }
  };

  if (logsLoading || configLoading) {
    return <></>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("st.logs.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-6">
          <div className="flex gap-4 p-6 border-b">
            <Select defaultValue={logsData?.date} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("st.logs.select_date")} />
              </SelectTrigger>
              <SelectContent>
                {availableDays.map(day => (
                  <SelectItem key={day} value={day}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("st.logs.log_level")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("st.logs.level.all")}</SelectItem>
                <SelectItem value="debug">{t("st.logs.level.debug")}</SelectItem>
                <SelectItem value="info">{t("st.logs.level.info")}</SelectItem>
                <SelectItem value="warn">{t("st.logs.level.warn")}</SelectItem>
                <SelectItem value="error">{t("st.logs.level.error")}</SelectItem>                
              </SelectContent>
            </Select>
          </div>
          <div className="px-4 space-y-4">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-2 py-4">{t("st.logs.table.level")}</TableHead>
                  <TableHead className="px-2 py-4">{t("st.logs.table.time")}</TableHead>
                  <TableHead className="px-2 py-4">{t("st.logs.table.model")}</TableHead>
                  <TableHead className="px-2 py-4">{t("st.logs.table.message")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="text-center h-28 text-muted-foreground">
                      {t("st.logs.no_logs")}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log, index) => (
                    <TableRow key={index} className="hover:bg-transparent">
                      <TableCell className="px-2 py-3">
                        <Badge variant={log.level === "error" ? "destructive" : log.level === "warn" ? "warning" : "outline"}>
                          {log.level.charAt(0).toUpperCase() + log.level.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-2 py-3">{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell className="px-2 py-3">{log.model}</TableCell>
                      <TableCell className="px-2 py-3">{log.message}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <PaginationPro
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t("st.logs.debug.title")}</CardTitle>
          <CardDescription>{t("st.logs.debug.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select defaultValue={configData?.save_debug || "0"} onValueChange={(value) => handleSaveConfig({ save_debug: value })}>
            <SelectTrigger className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t("st.logs.debug.disable")}</SelectItem>
              <SelectItem value="1">{t("st.logs.debug.enable")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </>
  );
}
