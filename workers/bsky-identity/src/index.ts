import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { BskyIdentityRoute } from '@/bsky-identity/src/route.js';

const app = new Hono().use(prettyJSON()).use(withCors()).route('/bsky-identity', BskyIdentityRoute);

export default app;
export type AppType = typeof app;
