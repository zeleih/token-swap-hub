import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient();
}

const cachedPrisma = globalForPrisma.prisma;
const needsFreshClient =
  !cachedPrisma || !("announcement" in (cachedPrisma as unknown as Record<string, unknown>));

export const prisma = needsFreshClient ? createPrismaClient() : cachedPrisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
