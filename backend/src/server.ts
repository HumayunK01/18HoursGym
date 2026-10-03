import { Server } from 'http';
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { logger } from './utils/logger.js';

export function createShutdownHandler(server: Server, onExit: (code: number) => void = process.exit) {
  let isShuttingDown = false;

  return (signal: string): Promise<void> => {
    if (isShuttingDown) {
      return Promise.resolve();
    }
    isShuttingDown = true;
    logger.info(`Received ${signal}. Initiating graceful shutdown...`);

    return new Promise<void>((resolve) => {
      // 1. Force shutdown fallback timer if draining takes too long
      const forceTimer = setTimeout(() => {
        logger.error('Could not drain in-flight connections in time. Forcefully terminating.');
        onExit(1);
        resolve();
      }, 10000);
      forceTimer.unref();

      // 2. Stop accepting new connections and close idle keep-alive sockets immediately
      server.closeIdleConnections?.();

      server.close(async (err) => {
        if (err) {
          logger.error(`Error closing HTTP server: ${err.message}`);
        } else {
          logger.info('HTTP server stopped accepting connections.');
        }

        // 3. Disconnect database connections
        try {
          await disconnectDB();
        } catch (dbErr) {
          logger.error(`Error disconnecting database: ${(dbErr as Error).message}`);
        }

        clearTimeout(forceTimer);
        logger.info('Graceful shutdown completed successfully.');
        onExit(0);
        resolve();
      });
    });
  };
}

async function bootstrap() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Gym Management Backend running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`🩺 Health check accessible at: http://localhost:${env.PORT}/health`);
    logger.info(`📚 Swagger API Docs at: http://localhost:${env.PORT}/api/docs`);
    logger.info(`🌐 Base API v1 at: http://localhost:${env.PORT}/api/v1`);
  });

  const shutdown = createShutdownHandler(server);

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Promise Rejection: ${reason instanceof Error ? reason.stack : reason}`);
    shutdown('unhandledRejection');
  });

  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error instanceof Error ? error.stack : error}`);
    shutdown('uncaughtException');
  });
}

export { bootstrap };

if (process.env.NODE_ENV !== 'test') {
  bootstrap().catch((error) => {
    logger.error(`Fatal error during bootstrap: ${error.message}`);
    process.exit(1);
  });
}
