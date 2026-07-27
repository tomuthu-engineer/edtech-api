import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from '@config/env';
import { createChildLogger } from '@config/logger';
import { verifyAccessToken } from '@utils/jwt';
import { createRedisConnection } from '@config/redis';
import { SocketEvent, SocketRoom } from '@socket/socketEvents.constant';
import { AuthenticatedSocket } from '@socket/types';
import { setIO } from '@socket/ioInstance';
import { registerCommunitySocketHandlers } from '@socket/handlers/community.socket';
import { registerLiveSocketHandlers } from '@socket/handlers/live.socket';

const socketLogger = createChildLogger('socket');

/** Tracks which userIds currently have at least one live socket connection. */
const onlineUsers = new Map<string, Set<string>>();

export function initializeSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: env.CORS_ORIGINS.split(',').filter(Boolean), credentials: true },
    transports: ['websocket', 'polling'],
  });

  const pubClient = createRedisConnection();
  const subClient = createRedisConnection();
  io.adapter(createAdapter(pubClient, subClient));

  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ??
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) return next(new Error('Authentication required'));

      const payload = verifyAccessToken(token);
      (socket as AuthenticatedSocket).userId = payload.sub;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on(SocketEvent.CONNECTION, (socket: Socket) => {
    const authedSocket = socket as AuthenticatedSocket;
    const { userId } = authedSocket;

    socket.join(SocketRoom.user(userId));
    markUserOnline(userId, socket.id);
    io.emit(SocketEvent.USER_ONLINE, { userId });

    socketLogger.info({ userId, socketId: socket.id }, 'Socket connected');

    registerCommunitySocketHandlers(io, authedSocket);
    registerLiveSocketHandlers(io, authedSocket);

    socket.on(SocketEvent.DISCONNECT, () => {
      const stillOnline = markUserOffline(userId, socket.id);
      if (!stillOnline) {
        io.emit(SocketEvent.USER_OFFLINE, { userId });
      }
      socketLogger.info({ userId, socketId: socket.id }, 'Socket disconnected');
    });
  });

  setIO(io);
  socketLogger.info('Socket.IO initialized');
  return io;
}

function markUserOnline(userId: string, socketId: string): void {
  const sockets = onlineUsers.get(userId) ?? new Set<string>();
  sockets.add(socketId);
  onlineUsers.set(userId, sockets);
}

/** Removes the socket and returns whether the user still has other active connections. */
function markUserOffline(userId: string, socketId: string): boolean {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return false;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(userId);
    return false;
  }
  onlineUsers.set(userId, sockets);
  return true;
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}

export { getIO, emitToUser, emitToCommunity, emitToLiveSession } from '@socket/ioInstance';
