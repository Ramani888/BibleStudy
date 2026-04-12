import './config/env'; // Load and validate env vars first

// BigInt serialization support — Prisma returns storageUsed/storageLimit as BigInt.
// Serialize as Number so the frontend User type (storageUsed: number) matches.
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this);
};

import app from './app';
import { connectDB, disconnectDB } from './config/db';
import { env } from './config/env';

const PORT = env.PORT || 3001;

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`
========================================
  BibleStudy Pro API
  Environment: ${env.NODE_ENV}
  Port: ${PORT}
  URL: http://localhost:${PORT}
  Health: http://localhost:${PORT}/health
========================================
      `);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log('Server shut down successfully');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Promise Rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      shutdown('uncaughtException').catch(console.error);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
