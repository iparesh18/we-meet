import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectMongo } from './config/db.js';
import { initStore } from './store/index.js';
import { initSocket } from './socket/index.js';
import { configured } from './services/livekitService.js';
import { logger } from './utils/logger.js';

async function main() {
  const useMongo = await connectMongo();
  initStore(useMongo);

  const app = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: [config.clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  initSocket(io);

  server.listen(config.port, () => {
    console.log('');
    console.log('  ┌──────────────────────────────────────────────┐');
    console.log('  │   Swastik server is running                    │');
    console.log('  └──────────────────────────────────────────────┘');
    console.log(`  • API:        http://localhost:${config.port}`);
    console.log(`  • Client URL: ${config.clientUrl}`);
    console.log(`  • Store:      ${useMongo ? 'MongoDB' : 'in-memory (data resets on restart)'}`);
    console.log(
      `  • LiveKit:    ${
        configured() ? 'configured' : 'NOT configured (set LIVEKIT_* in server/.env for video)'
      }`
    );
    console.log('');
    logger.info(
      `Swastik server listening on :${config.port} (store=${useMongo ? 'mongo' : 'memory'}, livekit=${
        configured() ? 'on' : 'off'
      })`
    );
  });

  const shutdown = () => {
    console.log('\n[server] Shutting down...');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.error('[fatal] Failed to start server:', err);
  process.exit(1);
});
