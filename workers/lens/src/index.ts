import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { LensTrendingClubsRoute } from '@/lens/src/route.js';

const app = new Hono().use(prettyJSON()).use(withCors()).route('/lens', LensTrendingClubsRoute);

export default app;
export type AppType = typeof app;
export type * from './types.js';
