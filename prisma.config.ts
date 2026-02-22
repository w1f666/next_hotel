// prisma.config.ts
import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  // 🌟 Prisma 7 的新要求：种子命令必须写在这里
  migrations: {
    seed: 'tsx ./prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});