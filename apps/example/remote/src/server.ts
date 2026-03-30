export type RemoteServerMessagePayload = {
  from?: string;
  loadedAt?: string;
};

export function getRemoteServerMessage(payload: RemoteServerMessagePayload = {}): string {
  const from = payload.from || 'astro_remote/server';
  const loadedAt = payload.loadedAt || new Date().toISOString();
  return `Remote SSR module loaded from ${from} at ${loadedAt}`;
}
