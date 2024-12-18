"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
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

  useEffect(() => {
    fetchAnimeList(currentPage);
  }, [currentPage]);

  return (
    <div className="min-h-screen container mx-auto py-8">
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
        <div className="grid gap-4">
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
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
