import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import type {
  InitResponse,
  SubmitScoreRequest,
  SubmitScoreResponse,
} from '../../shared/api';

type ErrorResponse = {
  status: 'error';
  message: string;
};

function highScoreKey(username: string) {
  return `highscore:${username}`;
}

export const api = new Hono();

api.get('/init', async (c) => {
  const { postId } = context;

  if (!postId) {
    console.error('API Init Error: postId not found in devvit context');
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required but missing from context',
      },
      400
    );
  }

  try {
    const username = (await reddit.getCurrentUsername()) ?? 'anonymous';
    const stored = await redis.get(highScoreKey(username));
    const highScore = stored ? parseInt(stored, 10) : 0;

    return c.json<InitResponse>({
      type: 'init',
      postId,
      username,
      highScore: Number.isFinite(highScore) ? highScore : 0,
    });
  } catch (error) {
    console.error(`API Init Error for post ${postId}:`, error);
    let errorMessage = 'Unknown error during initialization';
    if (error instanceof Error) {
      errorMessage = `Initialization failed: ${error.message}`;
    }
    return c.json<ErrorResponse>(
      { status: 'error', message: errorMessage },
      400
    );
  }
});

api.post('/submit-score', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'postId is required' },
      400
    );
  }

  const body = await c.req.json<SubmitScoreRequest>();
  const score = Math.max(0, Math.round(body.score ?? 0));
  const username = (await reddit.getCurrentUsername()) ?? 'anonymous';
  const key = highScoreKey(username);

  const stored = await redis.get(key);
  const previous = stored ? parseInt(stored, 10) : 0;
  const highScore = Math.max(previous, score);

  if (highScore > previous) {
    await redis.set(key, String(highScore));
  }

  return c.json<SubmitScoreResponse>({
    type: 'submit-score',
    postId,
    score,
    highScore,
  });
});
