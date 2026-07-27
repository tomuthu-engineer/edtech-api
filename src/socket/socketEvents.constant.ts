/** Canonical Socket.IO event names shared by server emitters and client apps. */
export enum SocketEvent {
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',

  // Presence
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',
  ONLINE_USERS = 'users:online',

  // Community
  COMMUNITY_POST_CREATED = 'community:post:created',
  COMMUNITY_POST_DELETED = 'community:post:deleted',
  COMMUNITY_POST_LIKED = 'community:post:liked',
  COMMUNITY_COMMENT_CREATED = 'community:comment:created',
  COMMUNITY_REPLY_CREATED = 'community:reply:created',
  COMMUNITY_TYPING = 'community:typing',

  // Notifications
  NOTIFICATION_NEW = 'notification:new',
  NOTIFICATION_UNREAD_COUNT = 'notification:unread_count',

  // Live classes
  LIVE_SESSION_STARTED = 'live:session:started',
  LIVE_SESSION_ENDED = 'live:session:ended',
  LIVE_ATTENDEE_JOINED = 'live:attendee:joined',
  LIVE_ATTENDEE_LEFT = 'live:attendee:left',
  LIVE_CHAT_MESSAGE = 'live:chat:message',
}

/** Socket.IO rooms, namespaced so a single connection can join many. */
export const SocketRoom = {
  user: (userId: string) => `user:${userId}`,
  liveSession: (sessionId: string) => `live-session:${sessionId}`,
  community: () => 'community:global',
};
