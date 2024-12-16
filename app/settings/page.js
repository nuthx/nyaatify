'use client';
import { useState, useEffect } from 'react';

export default function Settings() {
  const [rssUrl, setRssUrl] = useState('');

  useEffect(() => {
    const savedRssUrl = localStorage.getItem('rssUrl') || '';
    setRssUrl(savedRssUrl);
  }, []);

  const handleRssUrlChange = (e) => {
    const newUrl = e.target.value;
    setRssUrl(newUrl);
    localStorage.setItem('rssUrl', newUrl);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      <div className="mb-4">
        <label className="block mb-2">RSS URL:</label>
        <input
          type="text"
          value={rssUrl}
          onChange={handleRssUrlChange}
          placeholder="Enter RSS feed URL"
          className="border rounded p-2 w-full"
        />
      </div>
    </div>
  );
}
