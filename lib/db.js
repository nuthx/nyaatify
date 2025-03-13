import { PrismaClient } from "@prisma/client"
import { logger } from "@/lib/logger";

const globalForPrisma = global;

// Add type declaration for global prisma instance
const prismaInstance = new PrismaClient({
  log: ["error", "warn"]
});

// Simplify the global instance handling
if (process.env.NODE_ENV !== "production") {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance;

export async function initDb() {
  const defaultConfigs = [
    ["ai_priority", "local"],
    ["ai_api", ""],
    ["ai_key", ""],
    ["ai_model", ""],
    ["default_downloader", ""],
    ["show_downloader_state", "1"],
    ["title_priority", "jp,en,romaji,cn"],
    ["cover_source", "bangumi"]
  ];

  // Insert default configs，exists key will be ignored
  await Promise.all(
    defaultConfigs.map(([key, value]) =>
      prisma.config.upsert({
        where: { key },
        update: {},
        create: { key, value },
      })
    )
  );

  // Insert default user, exists user will be ignored
  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      username: "admin",
      password: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",  // admin
    },
  });

  logger.info("Database initialized", { model: "initDb" });
}

export async function getConfig() {
  const configs = await prisma.config.findMany();
  return Object.fromEntries(configs.map(({ key, value }) => [key, value]));
}
