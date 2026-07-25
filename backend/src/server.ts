import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { initSocketIO } from './sockets/donation.socket';
import { logger } from './utils/logger';

const startServer = async () => {
  await connectDB();

  const httpServer = http.createServer(app);
  initSocketIO(httpServer);

  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${env.PORT} is already in use. Free the port or set PORT to a different value.`);
      process.exit(1);
    }
    logger.error({ err }, 'Server error');
    process.exit(1);
  });

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
    logger.info(`📡 Socket.io ready`);
    logger.info(`📊 Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down...');
    httpServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
};

startServer().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
