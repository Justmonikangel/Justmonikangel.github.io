import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { runAutoRelay } from '../orchestrator/autoRelay.ts';
import { runTurn } from '../orchestrator/relay.ts';
import type { Attachment, ProviderTarget } from '../types.ts';

export const chatRoutes = new Hono();

chatRoutes.post('/:id/turn', async (c) => {
  const sessionId = c.req.param('id');
  const body = (await c.req.json()) as {
    target: ProviderTarget;
    message?: { content: string; attachments?: Attachment[] };
  };
  return streamSSE(c, async (stream) => {
    try {
      for await (const chunk of runTurn({
        sessionId,
        target: body.target,
        userMessage: body.message
          ? {
              content: body.message.content,
              attachments: body.message.attachments ?? [],
            }
          : undefined,
      })) {
        await stream.writeSSE({ event: 'delta', data: chunk });
      }
      await stream.writeSSE({ event: 'done', data: 'ok' });
    } catch (err) {
      await stream.writeSSE({
        event: 'error',
        data: (err as Error).message ?? 'unknown error',
      });
    }
  });
});

chatRoutes.post('/:id/auto-relay', async (c) => {
  const sessionId = c.req.param('id');
  const body = (await c.req.json()) as {
    rounds: number;
    stopOn?: string | string[];
    target?: ProviderTarget;
    message?: { content: string; attachments?: Attachment[] };
  };

  return streamSSE(c, async (stream) => {
    try {
      for await (const event of runAutoRelay({
        sessionId,
        rounds: body.rounds,
        stopOn: body.stopOn,
        target: body.target,
        userMessage: body.message
          ? {
              content: body.message.content,
              attachments: body.message.attachments ?? [],
            }
          : undefined,
      })) {
        if (event.type === 'turn-start') {
          await stream.writeSSE({
            event: 'turn-start',
            data: JSON.stringify({ role: event.role, round: event.round }),
          });
          continue;
        }

        await stream.writeSSE({ event: 'delta', data: event.delta });
      }

      await stream.writeSSE({ event: 'done', data: 'ok' });
    } catch (err) {
      await stream.writeSSE({
        event: 'error',
        data: (err as Error).message ?? 'unknown error',
      });
    }
  });
});
