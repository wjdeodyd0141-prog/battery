import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prisma v7: 직접 연결 대신 PrismaPg 어댑터 사용 (Railway에서 db push 연결 문제 해결)
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrate: {
    async adapter() {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
      return new PrismaPg(pool);
    },
  },
});
