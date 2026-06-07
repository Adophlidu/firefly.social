import { onError } from '@dimensiondev/workers-shared/middlewares/onError.js';
import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { IframeBlockRoute } from '@/iframe-blocker/src/route.js';

const app = new Hono().use(prettyJSON()).use(withCors()).route('/iframe-blocker', IframeBlockRoute).onError(onError);

export default app;
export type AppType = typeof app;
export type { IframeBlockCheckResult } from './types.js';
