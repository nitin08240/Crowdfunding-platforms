import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export let io: Server;

export const initSocketIO = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    socket.on('join_campaign', (campaignId: string) => {
      socket.join(`campaign_${campaignId}`);
      logger.debug(`Socket ${socket.id} joined campaign_${campaignId}`);
    });

    socket.on('leave_campaign', (campaignId: string) => {
      socket.leave(`campaign_${campaignId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const emitDonation = (campaignId: string, donationData: {
  amount: number;
  donorName: string;
  isAnonymous: boolean;
  message?: string;
  raisedAmount: number;
  donorCount: number;
}) => {
  if (io) {
    io.to(`campaign_${campaignId}`).emit('new_donation', donationData);
  }
};
