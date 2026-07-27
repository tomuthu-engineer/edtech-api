import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '@config/env';
import { CreateRoomInput, CreateRoomResult, GenerateTokenInput, LiveProvider } from '@lib/liveProviders/liveProvider.interface';

const TOKEN_TTL_SECONDS = 6 * 60 * 60; // 6h — comfortably covers a live class + buffer

/**
 * Mints LiveKit access tokens per their documented JWT grant format
 * (video.room / roomJoin / canPublish / canSubscribe claims), signed HS256
 * with the API key/secret pair. No livekit-server-sdk dependency required —
 * the token format is a stable, publicly documented spec.
 */
export class LiveKitProvider implements LiveProvider {
  async createRoom(input: CreateRoomInput): Promise<CreateRoomResult> {
    const roomName = `${input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${randomUUID().slice(0, 8)}`;
    const baseUrl = env.LIVEKIT_URL || 'wss://your-livekit-instance';

    return {
      meetingId: roomName,
      joinUrl: `${baseUrl}/rooms/${roomName}`,
      hostUrl: `${baseUrl}/rooms/${roomName}?role=host`,
    };
  }

  generateToken(input: GenerateTokenInput): string {
    if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
      throw new Error('LiveKit is not configured: set LIVEKIT_API_KEY / LIVEKIT_API_SECRET');
    }

    const now = Math.floor(Date.now() / 1000);

    return jwt.sign(
      {
        iss: env.LIVEKIT_API_KEY,
        sub: input.identity,
        name: input.displayName,
        nbf: now,
        exp: now + TOKEN_TTL_SECONDS,
        video: {
          room: input.roomName,
          roomJoin: true,
          canPublish: input.isHost,
          canPublishData: true,
          canSubscribe: true,
          roomAdmin: input.isHost,
        },
      },
      env.LIVEKIT_API_SECRET,
      { algorithm: 'HS256' },
    );
  }
}
