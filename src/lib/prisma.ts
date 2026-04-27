import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const connectionString = `${process.env.DATABASE_URL}`;

declare global {
	var prismaGlobal: undefined | PrismaClient;
	var pgPoolGlobal: undefined | pg.Pool;
}

const pool = globalThis.pgPoolGlobal ?? new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = globalThis.prismaGlobal ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
	globalThis.pgPoolGlobal = pool;
	globalThis.prismaGlobal = prisma;
}

export default prisma;
