import 'dotenv/config';
import { PrismaClient, TodoPriority, TodoStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

export const seedDemoData = async (client: PrismaClient) => {
  await client.session.deleteMany();
  await client.todo.deleteMany();
  await client.user.deleteMany();

  const passwordHash = await bcrypt.hash('demo1234', 10);

  const user = await client.user.create({
    data: {
      id: 'demo-user',
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash,
      lastLoginAt: new Date()
    }
  });

  await client.todo.createMany({
    data: [
      {
        title: 'Welcome to the Skeleton app 👋',
        description: 'Feel free to explore the codebase and tooling setup.',
        ownerId: user.id,
        status: TodoStatus.IN_PROGRESS,
        priority: TodoPriority.MEDIUM
      },
      {
        title: 'Connect to Postgres',
        description: 'Run pnpm db:push to sync the schema.',
        ownerId: user.id,
        status: TodoStatus.BACKLOG,
        priority: TodoPriority.HIGH,
        dueAt: new Date(Date.now() + 1000 * 60 * 60 * 48)
      },
      {
        title: 'Ship preview deployment',
        description: 'Push a branch and open a PR to trigger the preview automation.',
        ownerId: user.id,
        status: TodoStatus.DONE,
        priority: TodoPriority.LOW,
        dueAt: new Date()
      }
    ]
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
