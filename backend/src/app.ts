import path from 'path';
import fs from 'fs';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { env } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { generalRateLimiter } from './middlewares/rateLimiter';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins.length > 0 ? env.corsOrigins : true,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(generalRateLimiter);

  app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  app.use('/api', routes);

  // Serve the built web dashboard from web/dist if it exists
  const webDist = path.resolve(__dirname, '../../../web/dist');
  if (fs.existsSync(webDist)) {
    app.use(express.static(webDist));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(webDist, 'index.html'));
    });
  } else {
    app.use(notFoundHandler);
  }

  app.use(errorHandler);

  return app;
}
