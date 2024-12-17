"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const animeApi = "/api/anime";

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnimeList = async () => {
    try {
      const res = await fetch(animeApi);
      const { code, message, data } = await res.json();
      
      if (code !== 200) {
        setError(message);
        return;
      }

      if (!data || data.length === 0) {
        setError("Please add RSS subscription in settings first.");
        return;
      }
      
      setItems(data);
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
    fetchAnimeList();
  }, []);

  return (
    <div className="min-h-screen p-8">
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
                    {new Date(item.pubDate).toLocaleString()}
                  </time>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
