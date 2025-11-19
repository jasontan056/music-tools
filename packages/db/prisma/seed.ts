import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const main = async () => {
  await prisma.todo.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      id: 'demo-user',
      email: 'demo@example.com',
      name: 'Demo User'
    }
  });

  await prisma.todo.createMany({
    data: [
      {
        title: 'Welcome to the Skeleton app',
        description: 'Feel free to explore the codebase and tooling setup.',
        ownerId: user.id
      },
      {
        title: 'Connect to Postgres',
        description: 'Run pnpm db:push to sync the schema.',
        ownerId: user.id
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
