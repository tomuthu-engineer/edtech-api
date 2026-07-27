import { Server as SocketIOServer } from 'socket.io';
import { SocketEvent, SocketRoom } from '@socket/socketEvents.constant';

let io: SocketIOServer | undefined;

export function setIO(instance: SocketIOServer): void {
  io = instance;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO server has not been initialized yet');
  return io;
}

/** Emits an event to every socket belonging to a specific user (all devices). */
export function emitToUser(userId: string, event: SocketEvent, payload: unknown): void {
  getIO().to(SocketRoom.user(userId)).emit(event, payload);
}

/** Emits an event to the global community feed room. */
export function emitToCommunity(event: SocketEvent, payload: unknown): void {
  getIO().to(SocketRoom.community()).emit(event, payload);
}

/** Emits an event to everyone currently in a live session's room. */
export function emitToLiveSession(sessionId: string, event: SocketEvent, payload: unknown): void {
  getIO().to(SocketRoom.liveSession(sessionId)).emit(event, payload);
}
