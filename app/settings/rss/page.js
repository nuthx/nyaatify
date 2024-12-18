"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Title } from "@/components/settings/title";

const rssApi = "/api/settings/rss";
const rssAddApi = "/api/settings/rss/add";
const rssDeleteApi = "/api/settings/rss/delete";
const rssUpdateApi = "/api/settings/rss/update";

export default function RSSSettings() {
  const [feeds, setFeeds] = useState([]);
  const [newFeed, setNewFeed] = useState({
    name: "",
    url: "",
    interval: ""
  });

  useEffect(() => {
    fetchFeeds();
  }, []);

  const fetchFeeds = async () => {
    try {
      const response = await fetch(rssApi);
      const data = await response.json();
      setFeeds(data.data);
    } catch (error) {
      console.error("Error fetching feeds:", error);
    }
  };

  const handleAddFeed = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(rssAddApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newFeed),
      });

      if (response.ok) {
        setNewFeed({ name: "", url: "", interval: "300" });
        await fetch(rssUpdateApi);
        fetchFeeds();
      }
    } catch (error) {
      console.error("Error adding feed:", error);
    }
  };

  const handleDeleteFeed = async (id) => {
    try {
      await fetch(`${rssDeleteApi}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      await fetch(rssUpdateApi);
      fetchFeeds();
    } catch (error) {
      console.error("Error deleting feed:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Title 
        title="RSS Settings"
        description="Manage RSS feed sources"
      />
      <Separator />

      <form onSubmit={handleAddFeed} className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="feed-name">Feed Name</Label>
          <Input
            type="text"
            id="feed-name"
            value={newFeed.name}
            onChange={(e) => setNewFeed({...newFeed, name: e.target.value})}
            placeholder="Enter feed name"
            required
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="feed-url">RSS URL</Label>
          <Input
            type="url"
            id="feed-url"
            value={newFeed.url}
            onChange={(e) => setNewFeed({...newFeed, url: e.target.value})}
            placeholder="Enter RSS feed URL"
            required
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="feed-interval">Update Interval (minutes)</Label>
          <Input
            type="number"
            id="feed-interval"
            value={newFeed.interval}
            onChange={(e) => setNewFeed({...newFeed, interval: e.target.value})}
            min="1"
            placeholder="Enter update interval"
            required
          />
        </div>
        <Button type="submit">Add Feed</Button>
      </form>

      {/* Existing feeds list */}
      <div className="mt-8">
        <h4 className="text-lg font-medium mb-4">Existing Feeds</h4>
        <div className="space-y-4">
          {feeds.map((feed) => (
            <div key={feed.id} className="flex items-center justify-between p-4 border rounded">
              <div>
                <h5 className="font-medium">{feed.name}</h5>
                <p className="text-sm text-muted-foreground">{feed.url}</p>
                <p className="text-sm text-muted-foreground">Update interval: {feed.interval} minutes</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteFeed(feed.id)}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 