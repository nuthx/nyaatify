/*
  Warnings:

  - You are about to drop the column `pageAnilist` on the `Anime` table. All the data in the column will be lost.
  - You are about to drop the column `pageBangumi` on the `Anime` table. All the data in the column will be lost.
  - Added the required column `source` to the `Anime` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceUrl` to the `Anime` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Anime" (
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
    "coverAnilist" TEXT,
    "coverBangumi" TEXT,
    "idAnilist" TEXT,
    "idBangumi" TEXT,
    "pubDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL
);
INSERT INTO "new_Anime" ("coverAnilist", "coverBangumi", "createdAt", "hash", "id", "pubDate", "size", "titleCn", "titleEn", "titleJp", "titleParsed", "titleRaw", "titleRomaji", "torrent") SELECT "coverAnilist", "coverBangumi", "createdAt", "hash", "id", "pubDate", "size", "titleCn", "titleEn", "titleJp", "titleParsed", "titleRaw", "titleRomaji", "torrent" FROM "Anime";
DROP TABLE "Anime";
ALTER TABLE "new_Anime" RENAME TO "Anime";
CREATE UNIQUE INDEX "Anime_hash_key" ON "Anime"("hash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
