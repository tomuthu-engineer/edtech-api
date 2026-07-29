import { randomUUID } from 'crypto';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { env } from '@config/env';
import { CreateRoomInput, CreateRoomResult, GenerateTokenInput, LiveProvider } from '@lib/liveProviders/liveProvider.interface';

const TOKEN_TTL_SECONDS = 6 * 60 * 60; // 6h — matches LiveKitProvider's TTL

/**
 * Agora adapter using Agora's own official `agora-token` package —
 * RtcTokenBuilder.buildTokenWithUserAccount, so identities can stay UUID
 * strings (our user ids) instead of needing to be mapped to numeric uids.
 * Host/staff get PUBLISHER (can send audio/video); everyone else gets
 * SUBSCRIBER (receive-only) — mirrors LiveKitProvider's canPublish split.
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

    const role = input.isHost ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    return RtcTokenBuilder.buildTokenWithUserAccount(
      env.AGORA_APP_ID,
      env.AGORA_APP_CERTIFICATE,
      input.roomName,
      input.identity,
      role,
      TOKEN_TTL_SECONDS,
      TOKEN_TTL_SECONDS,
    );
  }
}
