import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { SnapRoute } from '@/snap/src/route.js';

const app = new Hono().use(prettyJSON()).use(withCors()).route('/fc-snap', SnapRoute);

export default app;
export type AppType = typeof app;
export type * from './types.js';
