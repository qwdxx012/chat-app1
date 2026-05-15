import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Настройка пула соединений с PostgreSQL
const adapter = new PrismaPg(
  new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,                      // Максимум 5 одновременных соединений
    idleTimeoutMillis: 30000,    // Закрываем неиспользуемые соединения через 30 сек
    connectionTimeoutMillis: 5000, // Ждём соединения не дольше 5 сек
  })
);

const prisma = new PrismaClient({ adapter });

export default prisma;
