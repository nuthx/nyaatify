"use client";

import useSWR from "swr"
import { toast } from "sonner"
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
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
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PaginationPro } from "@/components/pagination";

export default function Logs() {
  const logsApi = "/api/logs";

  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [level, setLevel] = useState("all");
  const [availableDays, setAvailableDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 80;

  const { data, error, isLoading } = useSWR(
    selectedDate ? `${logsApi}?date=${selectedDate}` : logsApi,
    async (url) => {
      const response = await fetch(url);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message);
      }
      return result.data;
    }
  );

  useEffect(() => {
    if (error) {
      toast.error(t("toast.failed.fetch_logs"), {
        description: error.message,
      });
    }
    if (data) {
      setLogs(data.logs);
      setFilteredLogs(data.logs);
      setAvailableDays(data.days);
    }
  }, [error, data]);

  useEffect(() => {
    setFilteredLogs(level === "all" ? logs : logs.filter(log => log.level === level));
    setCurrentPage(1);
  }, [level, logs]);

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  if (isLoading) {
    return <></>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("st.logs.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select defaultValue={data?.date} onValueChange={setSelectedDate}>
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
                <SelectItem value="all">{t("st.logs.all")}</SelectItem>
                <SelectItem value="info">{t("st.logs.info")}</SelectItem>
                <SelectItem value="warn">{t("st.logs.warn")}</SelectItem>
                <SelectItem value="error">{t("st.logs.error")}</SelectItem>                
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("st.logs.table.level")}</TableHead>
                <TableHead>{t("st.logs.table.time")}</TableHead>
                <TableHead>{t("st.logs.table.model")}</TableHead>
                <TableHead>{t("st.logs.table.message")}</TableHead>
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
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant={log.level === "error" ? "destructive" : log.level === "warn" ? "warning" : "outline"}>
                        {log.level.charAt(0).toUpperCase() + log.level.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{log.model}</TableCell>
                    <TableCell>{log.message}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <div className="mt-4">
            <PaginationPro
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
