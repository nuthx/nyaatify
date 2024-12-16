'use client';
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const rssApi = '/api/setting/rss';
const rssAddApi = '/api/setting/rss/add';
const rssDeleteApi = '/api/setting/rss/delete';

export default function Settings() {
  const [feeds, setFeeds] = useState([]);
  const [newFeed, setNewFeed] = useState({
    name: '',
    url: '',
    interval: ''
  });
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchFeeds();
  }, []);

  const fetchFeeds = async () => {
    try {
      const response = await fetch(rssApi);
      const data = await response.json();
      setFeeds(data);
    } catch (error) {
      console.error('Error fetching feeds:', error);
    }
  };

  const handleAddFeed = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(rssAddApi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFeed),
      });

      if (response.ok) {
        setNewFeed({ name: '', url: '', interval: '300' });
        fetchFeeds();
      }
    } catch (error) {
      console.error('Error adding feed:', error);
    }
  };

  const handleDeleteFeed = async (id) => {
    try {
      await fetch(`${rssDeleteApi}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      fetchFeeds();
    } catch (error) {
      console.error('Error deleting feed:', error);
    }
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage Nyaatify settings and preferences
        </p>
      </div>
      <Separator className="mb-6" />

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-1/4 pr-6">
          <nav className="space-y-2">
            <button
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeTab === 'general' ? 'bg-secondary' : ''
              }`}
              onClick={() => setActiveTab('general')}
            >
              RSS Settings
            </button>
            <button
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeTab === 'version' ? 'bg-secondary' : ''
              }`}
              onClick={() => setActiveTab('version')}
            >
              About
            </button>
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">RSS Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Manage RSS feed sources
                </p>
              </div>
              <Separator />
              
              {/* Add new feed form */}
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
                        <p className="text-sm text-muted-foreground">Update interval: {feed.update_interval} minutes</p>
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
          )}

          {activeTab === 'version' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">About</h3>
                <p className="text-sm text-muted-foreground">
                  Current application version details
                </p>
              </div>
              <Separator />
              <div className="text-sm">
                <p>Version: 0.0.1</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
