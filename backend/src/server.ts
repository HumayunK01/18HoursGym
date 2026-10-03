import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

async function bootstrap() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Gym Management Backend running on port ${env.PORT} [${env.NODE_ENV}]`);
    console.log(`🩺 Health check accessible at: http://localhost:${env.PORT}/health`);
    console.log(`📚 Swagger API Docs at: http://localhost:${env.PORT}/api/docs`);
    console.log(`🌐 Base API v1 at: http://localhost:${env.PORT}/api/v1`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);
    server.close(async () => {
      console.log('🔒 HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });

    // Force shutdown if taking longer than 10s
    setTimeout(() => {
      console.error('⚠️ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('❌ Fatal error during bootstrap:', error);
  process.exit(1);
});
