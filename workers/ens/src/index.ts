import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { EnsRoute } from '@/ens/src/route.js';

const app = new Hono().use(prettyJSON()).use(withCors()).route('/ens', EnsRoute);

export default app;
export type AppType = typeof app;
