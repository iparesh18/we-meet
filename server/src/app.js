import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/error.js';
import { accessLogStream } from './utils/logger.js';

export function createApp() {
  const app = express();

  // HTTP request logging: concise to the console, full "combined" to logs/access.log.
  app.use(morgan('dev'));
  app.use(morgan('combined', { stream: accessLogStream }));

  // Allow the configured client plus common localhost variants during dev.
  const allowedOrigins = new Set([
    config.clientUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.has(origin)) return cb(null, true);
        return cb(null, true); // be permissive in dev; tighten for production
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '200kb' }));
  app.set('trust proxy', 1);

  app.get('/', (req, res) => res.json({ name: 'Swastik API', status: 'ok' }));
  app.use('/api', apiLimiter, routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
