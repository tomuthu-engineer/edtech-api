export interface CreateRoomInput {
  roomName: string;
  title: string;
}

export interface CreateRoomResult {
  meetingId: string;
  joinUrl: string;
  hostUrl: string;
}

export interface GenerateTokenInput {
  roomName: string;
  identity: string;
  displayName: string;
  isHost: boolean;
}

/**
 * Provider-agnostic contract for live-class video infrastructure. Swapping
 * LiveKit for Agora (or vice versa) means writing one new adapter class —
 * nothing in LiveService or the routes needs to change.
 */
export interface LiveProvider {
  createRoom(input: CreateRoomInput): Promise<CreateRoomResult>;
  generateToken(input: GenerateTokenInput): string;
}
