'use client';
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const [rssUrl, setRssUrl] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const savedRssUrl = localStorage.getItem('rssUrl') || '';
    setRssUrl(savedRssUrl);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('rssUrl', rssUrl);
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage Nyaatify settings and other preferences.
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
              General Settings
            </button>
            <button
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeTab === 'version' ? 'bg-secondary' : ''
              }`}
              onClick={() => setActiveTab('version')}
            >
              Version Info
            </button>
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">RSS Subscription</h3>
                <p className="text-sm text-muted-foreground">
                  Configure the RSS feed URL you want to subscribe to
                </p>
              </div>
              <Separator />
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="rss-url">RSS URL</Label>
                    <Input
                      type="url"
                      id="rss-url"
                      value={rssUrl}
                      onChange={(e) => setRssUrl(e.target.value)}
                      placeholder="Enter RSS feed URL"
                    />
                  </div>
                  <Button type="submit">Save Settings</Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'version' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Version Information</h3>
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
