import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { UnifiBadgeLevelRoute } from '@/unifi-badge-level/src/route.js';

const app = new Hono().use(prettyJSON()).use(withCors()).route('/unifi-badge-level', UnifiBadgeLevelRoute);

export default app;
export type AppType = typeof app;
