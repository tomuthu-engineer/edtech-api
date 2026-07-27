import { randomUUID, createHmac } from 'crypto';
import { env } from '@config/env';
import { CreateRoomInput, CreateRoomResult, GenerateTokenInput, LiveProvider } from '@lib/liveProviders/liveProvider.interface';

/**
 * Agora adapter satisfying the same LiveProvider contract as LiveKit.
 * Agora's real RtcTokenBuilder algorithm (CRC32 channel name checksum +
 * AES-encrypted privilege bitmask) is non-trivial and normally comes from
 * their official `agora-access-token` server package — swap the body of
 * generateToken() for that package's `RtcTokenBuilder.buildTokenWithUid`
 * when going live with Agora. This HMAC-signed placeholder keeps the
 * interface wired end-to-end (routes, service, socket rooms) so switching
 * providers later is a one-file change.
 */
export class AgoraProvider implements LiveProvider {
  async createRoom(input: CreateRoomInput): Promise<CreateRoomResult> {
    const channel = `${input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${randomUUID().slice(0, 8)}`;

    return {
      meetingId: channel,
      joinUrl: `agora://${env.AGORA_APP_ID || 'app-id'}/${channel}`,
      hostUrl: `agora://${env.AGORA_APP_ID || 'app-id'}/${channel}?role=host`,
    };
  }

  generateToken(input: GenerateTokenInput): string {
    if (!env.AGORA_APP_ID || !env.AGORA_APP_CERTIFICATE) {
      throw new Error('Agora is not configured: set AGORA_APP_ID / AGORA_APP_CERTIFICATE');
    }

    const payload = `${env.AGORA_APP_ID}:${input.roomName}:${input.identity}:${input.isHost ? 'host' : 'audience'}`;
    return createHmac('sha256', env.AGORA_APP_CERTIFICATE).update(payload).digest('hex');
  }
}
