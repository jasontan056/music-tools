import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

export const seedDemoData = async (client: PrismaClient) => {
  await client.session.deleteMany();
  await client.user.deleteMany();

  const passwordHash = await bcrypt.hash('demo1234', 10);

  await client.user.create({
    data: {
      id: 'demo-user',
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash,
      lastLoginAt: new Date()
    }
  });
};

const isDirectRun = () => {
  const entry = process.argv?.[1];
  if (!entry) {
    return false;
  }
  const absolute = path.isAbsolute(entry) ? entry : path.join(process.cwd(), entry);
  return import.meta.url === pathToFileURL(absolute).href;
};

const run = async () => {
  const prisma = new PrismaClient();
  try {
    await seedDemoData(prisma);
  } finally {
    await prisma.$disconnect();
  }
};

if (isDirectRun()) {
  run().catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  });
}
