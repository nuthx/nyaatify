'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRss = async () => {
      const rssUrl = localStorage.getItem('rssUrl');
      
      if (!rssUrl) {
        setError('Please configure RSS URL first');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/rss?url=${encodeURIComponent(rssUrl)}`);
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

    fetchRss();
  }, []);

  return (
    <div className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Nyaaitfy</h1>
        <Link href="/settings" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
          Settings
        </Link>
      </div>
      
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <div className="text-red-500 p-4 border border-red-300 rounded-lg bg-red-50">
          {error}
          <Link href="/settings" className="ml-2 text-blue-500 hover:underline">
            Go to Settings
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item, index) => (
            <li key={index} className="border p-4 rounded-lg hover:bg-gray-50">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline block"
              >
                {item.title}
              </a>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(item.pubDate).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
