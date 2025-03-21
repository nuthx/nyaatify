-- CreateTable
CREATE TABLE "Anime" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hash" TEXT NOT NULL,
    "titleRaw" TEXT NOT NULL,
    "titleParsed" TEXT,
    "titleJp" TEXT,
    "titleCn" TEXT,
    "titleEn" TEXT,
    "titleRomaji" TEXT,
    "size" TEXT,
    "torrent" TEXT,
    "categoryId" TEXT,
    "coverAnilist" TEXT,
    "coverBangumi" TEXT,
    "pageAnilist" TEXT,
    "pageBangumi" TEXT,
    "pubDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Rss" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cron" TEXT NOT NULL,
    "state" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refreshedAt" DATETIME,
    "refreshCount" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Downloader" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cookie" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "filter" TEXT,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "extra" TEXT,
    "state" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Device" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "browser" TEXT,
    "os" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Config" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AnimeToRss" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_AnimeToRss_A_fkey" FOREIGN KEY ("A") REFERENCES "Anime" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AnimeToRss_B_fkey" FOREIGN KEY ("B") REFERENCES "Rss" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Anime_hash_key" ON "Anime"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Rss_name_key" ON "Rss"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Downloader_name_key" ON "Downloader"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Downloader_url_key" ON "Downloader"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_name_key" ON "Notification"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Device_token_key" ON "Device"("token");

-- CreateIndex
CREATE UNIQUE INDEX "_AnimeToRss_AB_unique" ON "_AnimeToRss"("A", "B");

-- CreateIndex
CREATE INDEX "_AnimeToRss_B_index" ON "_AnimeToRss"("B");
