"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink
} from "@/components/ui/pagination";

const animeApi = "/api/anime";

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchAnimeList = async (page = 1) => {
    try {
      const res = await fetch(`${animeApi}?page=${page}`);
      const { code, message, data, pagination } = await res.json();
      
      if (code !== 200) {
        setError(message);
        return;
      }

      if (!data || data.length === 0) {
        setError("Please add RSS subscription in settings first.");
        return;
      }
      
      setItems(data);
      setTotalPages(Math.ceil(pagination.total / pagination.size));
      setError(null);
    } 
    
    catch (error) {
      setError("Failed to load list");
    } 
    
    finally {
      setLoading(false);
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

  useEffect(() => {
    fetchAnimeList(currentPage);
  }, [currentPage]);

  return (
    <div className="container mx-auto max-w-screen-xl flex flex-col py-8 space-y-6">
      {loading ? (
        <div className="flex items-center justify-center">
          <p>Loading...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Link href="/settings" className="ml-2 text-blue-500 hover:underline">
              Go to Settings
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-2">
          {items.map((item, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline flex items-center gap-2"
                    >
                      {item.title}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <time className="text-sm text-muted-foreground">
                      {new Date(item.date).toLocaleString()}
                    </time>
                  </div>
                  {item.rss_names && (
                    <div className="flex gap-2">
                      {item.rss_names.split(',').map((name, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {!loading && !error && totalPages > 1 && (
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
