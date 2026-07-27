import { LiveSessionProvider } from '@prisma/client';
import { LiveProvider } from '@lib/liveProviders/liveProvider.interface';
import { LiveKitProvider } from '@lib/liveProviders/livekit.provider';
import { AgoraProvider } from '@lib/liveProviders/agora.provider';
import { env } from '@config/env';

const providers: Partial<Record<LiveSessionProvider, LiveProvider>> = {
  LIVEKIT: new LiveKitProvider(),
  AGORA: new AgoraProvider(),
};

export function getLiveProvider(provider?: LiveSessionProvider): LiveProvider {
  const key = provider ?? (env.LIVE_DEFAULT_PROVIDER as LiveSessionProvider);
  const instance = providers[key];
  if (!instance) {
    throw new Error(`No live provider adapter registered for "${key}". CUSTOM/ZOOM require a bespoke adapter.`);
  }
  return instance;
}

export type { LiveProvider } from '@lib/liveProviders/liveProvider.interface';
