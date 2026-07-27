import { Server as SocketIOServer } from 'socket.io';
import { AuthenticatedSocket } from '@socket/types';
import { SocketEvent, SocketRoom } from '@socket/socketEvents.constant';
import { createChildLogger } from '@config/logger';

const logger = createChildLogger('socket:community');

interface TypingPayload {
  postId: string;
  isTyping: boolean;
}

/**
 * Community feed is a single global room; likes/comments/replies are
 * broadcast to it from the service layer via emitToCommunity(). This
 * handler only wires up client -> server signals (join feed, typing).
 */
export function registerCommunitySocketHandlers(
  _io: SocketIOServer,
  socket: AuthenticatedSocket,
): void {
  socket.join(SocketRoom.community());

  socket.on(SocketEvent.COMMUNITY_TYPING, (payload: TypingPayload) => {
    socket.to(SocketRoom.community()).emit(SocketEvent.COMMUNITY_TYPING, {
      userId: socket.userId,
      postId: payload.postId,
      isTyping: payload.isTyping,
    });
  });

  logger.debug({ userId: socket.userId }, 'Joined community feed room');
}
