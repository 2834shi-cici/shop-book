import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const TEST_DATABASE_URL =
  'postgresql://shopbook:shopbook@localhost:5432/shopbook_test?schema=public';

module.exports = async () => {
  // Ensure test database exists
  const adminClient = new PrismaClient({
    datasources: {
      db: { url: 'postgresql://shopbook:shopbook@localhost:5432/postgres?schema=public' },
    },
  });

  try {
    await adminClient.$executeRawUnsafe(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'shopbook_test';`,
    );
    await adminClient.$executeRawUnsafe(`DROP DATABASE IF EXISTS shopbook_test;`);
    await adminClient.$executeRawUnsafe(`CREATE DATABASE shopbook_test;`);
  } finally {
    await adminClient.$disconnect();
  }

  // Run migrations against test database
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  execSync('npx prisma migrate deploy', {
    cwd: __dirname + '/..',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });

  // Make test DB URL available to tests
  process.env.DATABASE_URL = TEST_DATABASE_URL;
};
