'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink } from "lucide-react";

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRss = async () => {
    const rssUrl = localStorage.getItem('rssUrl');
    
    if (!rssUrl) {
      setError('Please configure RSS URL first');
      setLoading(false);
      return;
    }

    try {
      await fetch(`/api/rss/update?url=${encodeURIComponent(rssUrl)}`);
      
      const res = await fetch('/api/rss/latest');
      const data = await res.json();
      
      if (!data.items || data.items.length === 0) {
        throw new Error('Failed to parse RSS');
      }
      
      setItems(data.items);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch RSS:', error);
      setError('RSS configuration error, please check if the RSS URL is correct');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRss();
    
    const updateInterval = parseInt(localStorage.getItem('updateInterval') || '300', 10);
    const intervalMs = updateInterval * 1000;
    
    const interval = setInterval(fetchRss, intervalMs);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Nyaaitfy</h1>
        <Button asChild>
          <Link href="/settings">Settings</Link>
        </Button>
      </div>
      
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
