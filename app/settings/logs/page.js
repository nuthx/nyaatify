"use client";

import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { API } from "@/lib/http/api";
import { useData } from "@/lib/http/swr";
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
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [level, setLevel] = useState("all");
  const [availableDays, setAvailableDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 80;

  const { data: logsData, isLoading: logsLoading } = useData(selectedDate ? `${API.LOGS}?date=${selectedDate}` : API.LOGS, t("toast.failed.fetch_logs"));

  // Set page title
  useEffect(() => {
    document.title = `${t("st.metadata.logs")} - Nyaatify`;
  }, [t]);

  useEffect(() => {
    if (logsData) {
      setLogs(logsData.logs);
      setFilteredLogs(logsData.logs);
      setAvailableDays(logsData.days);
    }
  }, [logsData]);

  useEffect(() => {
    setFilteredLogs(level === "all" ? logs : logs.filter(log => log.level === level));
    setCurrentPage(1);
  }, [level, logs]);

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  if (logsLoading) {
    return <></>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("st.logs.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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

          <div className="px-4 pb-2">
            {paginatedLogs.length === 0 ? (
              <div className="my-16 text-sm text-center text-muted-foreground">
                {t("st.logs.no_logs")}
              </div>
            ) : (
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
                  {paginatedLogs.map((log, index) => (
                    <TableRow key={index} className="hover:bg-transparent">
                      <TableCell className="px-2 py-3">
                        <Badge variant={
                          log.level === "error" ? "destructive" : 
                          log.level === "warn" ? "warning" : 
                          log.level === "debug" ? "debug" : 
                          "outline"
                        }>
                          {log.level.charAt(0).toUpperCase() + log.level.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-2 py-3">{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell className="px-2 py-3">{log.model}</TableCell>
                      <TableCell className="px-2 py-3">{log.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <PaginationPro
            className="px-6 py-4 border-t"
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </>
  );
}
