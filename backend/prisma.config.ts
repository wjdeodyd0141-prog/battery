import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prisma v7: datasource.url(스키마 비교용) + migrate.adapter(실제 연결용) 모두 필요
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrate: {
    async adapter() {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
      return new PrismaPg(pool);
    },
  },
});
