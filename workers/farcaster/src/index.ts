import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { FarcasterMessageRoute } from '@/farcaster/src/message/route.js';

const farcaster = new Hono().route('/message', FarcasterMessageRoute);

const app = new Hono().use(prettyJSON()).use(withCors()).route('/farcaster', farcaster);

export default app;
export type AppType = typeof app;
