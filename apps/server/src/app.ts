import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter, createContext } from '@acme/api';
import { APP_TITLE } from '@acme/common';
import { serverConfig } from './env.js';

export const createServer = () => {
  const app = express();

  app.use(cors({ origin: serverConfig.webUrl, credentials: true }));
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', app: APP_TITLE, timestamp: new Date().toISOString() });
  });

  app.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );

  return app;
};
