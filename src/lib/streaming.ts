import { enrichAndSaveFriend, enrichAndSaveList } from '@/lib/tmdb';
import { Settings } from '@/lib/types';

export function createStreamingResponse(
  fn: (send: (data: object) => void) => Promise<void>
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
      }
      try {
        await fn(send);
      } catch (err) {
        send({ step: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

export function maybeTriggerFriendEnrichment(username: string, settings: Settings): void {
  if (settings.tmdb_api_key) {
    enrichAndSaveFriend(username, settings.tmdb_api_key).catch(console.error);
  }
}

export function maybeTriggerListEnrichment(id: string, settings: Settings): void {
  if (settings.tmdb_api_key) {
    enrichAndSaveList(id, settings.tmdb_api_key).catch(console.error);
  }
}
