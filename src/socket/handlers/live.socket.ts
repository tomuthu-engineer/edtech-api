import { Server as SocketIOServer } from 'socket.io';
import { AuthenticatedSocket } from '@socket/types';
import { SocketEvent, SocketRoom } from '@socket/socketEvents.constant';
import { createChildLogger } from '@config/logger';

const logger = createChildLogger('socket:live');

interface JoinSessionPayload {
  sessionId: string;
}

interface ChatMessagePayload {
  sessionId: string;
  message: string;
}

/** Handles client-driven join/leave/chat for a live-session room. */
export function registerLiveSocketHandlers(io: SocketIOServer, socket: AuthenticatedSocket): void {
  socket.on(SocketEvent.LIVE_ATTENDEE_JOINED, ({ sessionId }: JoinSessionPayload) => {
    socket.join(SocketRoom.liveSession(sessionId));
    io.to(SocketRoom.liveSession(sessionId)).emit(SocketEvent.LIVE_ATTENDEE_JOINED, {
      userId: socket.userId,
      sessionId,
    });
    logger.debug({ userId: socket.userId, sessionId }, 'Joined live session room');
  });

  socket.on(SocketEvent.LIVE_ATTENDEE_LEFT, ({ sessionId }: JoinSessionPayload) => {
    socket.leave(SocketRoom.liveSession(sessionId));
    io.to(SocketRoom.liveSession(sessionId)).emit(SocketEvent.LIVE_ATTENDEE_LEFT, {
      userId: socket.userId,
      sessionId,
    });
  });

  socket.on(SocketEvent.LIVE_CHAT_MESSAGE, ({ sessionId, message }: ChatMessagePayload) => {
    io.to(SocketRoom.liveSession(sessionId)).emit(SocketEvent.LIVE_CHAT_MESSAGE, {
      userId: socket.userId,
      sessionId,
      message,
      sentAt: new Date().toISOString(),
    });
  });
}
