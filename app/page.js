"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink
} from "@/components/ui/pagination";
import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge"
import { LayoutGrid, Rows3 } from "lucide-react";

export default function Home() {
  const animeApi = "/api/anime";

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast()
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    // Get initial page from URL on first render
    if (!currentPage) {
      const pageFromUrl = Number(searchParams.get("page")) || 1;
      setCurrentPage(pageFromUrl);
      return;
    }

    // Fetch data and update URL when currentPage changes
    fetchAnime(currentPage);
    if (currentPage > 1) {
      router.push(`?page=${currentPage}`);
    } else {
      router.push("/");
    }
  }, [currentPage, searchParams, router]);

  const fetchAnime = async (page = 1) => {
    try {
      const response = await fetch(`${animeApi}?page=${page}`);
      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        setError("Please add a RSS subscription first.");
        return;
      }
      
      setItems(data.data);
      setTotalPages(Math.ceil(data.pagination.total / data.pagination.size));
      setError(null);
    } catch (error) {
      setError(`Failed to load list: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPageItem = (page, isActive = false) => (
    <PaginationItem key={page}>
      <PaginationLink className="cursor-pointer" onClick={() => setCurrentPage(page)} isActive={isActive}>
        {page}
      </PaginationLink>
    </PaginationItem>
  );

  const renderPageItems = (start, count) => (
    [...Array(count)].map((_, i) => renderPageItem(start + i, start + i === currentPage))
  );

  return (
    <div className="container mx-auto max-w-screen-xl flex flex-col py-8 space-y-6">
      {isLoading ? (
        <></>
      ) : error ? (
        <a className="text-sm text-center text-zinc-500">
          {error}
        </a>
      ) : (
        <div className="grid gap-3">
          <div className="flex gap-4 mx-1 mb-3">
            <a className="text-sm text-zinc-500">Today: 10</a>
            <a className="text-sm text-zinc-500">Week: 20</a>
            <a className="text-sm text-zinc-500">Total: 100</a>
          </div>
          {items.map((item, index) => (
            <Card key={index}>
              <CardContent className="flex flex-col gap-2">
                {item.rss_names && (
                  <div className="flex gap-2">
                    <Badge variant="outline">{new Date(item.date).toLocaleString()}</Badge>
                    {item.rss_names.split(",").map((name, idx) => (
                      <Badge key={idx} variant="outline">{name}</Badge>
                    ))}
                  </div>
                )}
                <a href={item.torrent} target="_blank" className="font-medium hover:underline">{item.title}</a>
                <a className="text-sm text-zinc-500">{item.title}</a>
              </CardContent>
              <Separator />
              <CardFooter className="flex items-center justify-between py-4">
                <a className="text-sm text-zinc-500">1.5GiB / {item.size}</a>
                <div className="flex items-center gap-2">
                  <Button className="w-auto">Download</Button>
                  <Button className="w-auto">Pause</Button>
                  <Button className="w-auto">Delete</Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      {!isLoading && !error && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {totalPages > 7 ? (
              <>
                {currentPage <= 4 ? (
                  <>
                    {renderPageItems(1, 6)}
                    <PaginationEllipsis />
                    {renderPageItem(totalPages)}
                  </>
                ) : 
                currentPage > totalPages - 4 ? (
                  <>
                    {renderPageItem(1)}
                    <PaginationEllipsis />
                    {renderPageItems(totalPages - 5, 6)}
                  </>
                ) : 
                (
                  <>
                    {renderPageItem(1)}
                    <PaginationEllipsis />
                    {renderPageItems(currentPage - 2, 5)}
                    <PaginationEllipsis />
                    {renderPageItem(totalPages)}
                  </>
                )}
              </>
            ) : (
              renderPageItems(1, totalPages)
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
