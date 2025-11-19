import 'dotenv/config';
import { PrismaClient, TodoPriority, TodoStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const main = async () => {
  await prisma.session.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('demo1234', 10);

  const user = await prisma.user.create({
    data: {
      id: 'demo-user',
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash,
      lastLoginAt: new Date()
    }
  });

  await prisma.todo.createMany({
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

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
