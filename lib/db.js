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

export async function initConfigs() {
  const defaultConfigs = [
    ["aiPriority", "local"],
    ["aiApi", ""],
    ["aiKey", ""],
    ["aiModel", ""],
    ["defaultDownloader", ""],
    ["showDownloaderState", "1"],
    ["titlePriority", "jp,en,romaji,cn"],
    ["coverSource", "bangumi"]
  ];

  const results = await Promise.all(
    defaultConfigs.map(async ([key, value]) => {
      // Check existing configs
      const existingConfig = await prisma.config.findUnique({
        where: { key }
      });
      
      // Insert default configs, exists key will be ignored
      await prisma.config.upsert({
        where: { key },
        update: {},
        create: { key, value },
      });

      // Return key only if config is newly created
      return existingConfig ? null : key;
    })
  );

  // Filter out null values to get only new configs
  const newConfigs = results.filter(Boolean);
  
  // Only log if any new configs were created
  if (newConfigs.length > 0) {
    logger.info(`Configs initialized, keys: ${newConfigs.join(", ")}`, { model: "initConfigs" });
  }
}

export async function initUser() {
  // Check if user exists first
  const existingUser = await prisma.user.findUnique({
    where: { id: 1 }
  });

  // Insert default user, exists user will be ignored
  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      username: "admin",
      password: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",  // admin
    },
  });

  // Log only if user was newly created
  if (!existingUser) {
    logger.info("Default user created", { model: "initUser" });
  }
}

export async function getConfig() {
  const configs = await prisma.config.findMany();
  return Object.fromEntries(configs.map(({ key, value }) => [key, value]));
}
