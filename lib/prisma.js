import { PrismaClient } from '@prisma/client'
import crypto from "crypto";
import { logger } from "@/lib/logger";

const defaultConfigs = [
  ["db_version", "1.0"],
  ["ai_priority", "local"],
  ["ai_api", ""],
  ["ai_key", ""],
  ["ai_model", ""],
  ["default_downloader", ""],
  ["show_downloader_state", "1"],
  ["title_priority", "jp,en,romaji,cn"],
  ["cover_source", "bangumi"],
  ["save_debug", "0"]
];

const globalForPrisma = global;
globalForPrisma.prisma = globalForPrisma.prisma || new PrismaClient();

export const prisma = globalForPrisma.prisma;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function initDb() {
  try {
    await Promise.all(
      defaultConfigs.map(([key, value]) =>
        prisma.config.upsert({
          where: { key },
          update: {},
          create: { key, value },
        })
      )
    );

    await prisma.user.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        username: "admin",
        password: crypto.createHash("sha256").update("admin").digest("hex"),
        createdAt: new Date(),
      },
    });

    logger.debug("Database initialized", { model: "initDb" });
    return prisma;
  } catch (error) {
    logger.error(error.message, { model: "initDb" });
    return null;
  }
}

export async function getConfig() {
  try {
    const configs = await prisma.config.findMany();
    const configObject = configs.reduce(
      (acc, { key, value }) => ({ ...acc, [key]: value }),
      {}
    );

    logger.debug("Get config successfully", { model: "getConfig" });
    return configObject;
  } catch (error) {
    logger.error(error.message, { model: "getConfig" });
    return null;
  }
}