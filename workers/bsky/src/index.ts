import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { BskyIdentityRoute } from '@/bsky/src/identity/route.js';

const bsky = new Hono().route('/identity', BskyIdentityRoute);

const app = new Hono().use(prettyJSON()).use(withCors()).route('/bsky', bsky);

export default app;
export type AppType = typeof app;
