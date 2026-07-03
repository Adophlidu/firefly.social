import { onError } from '@dimensiondev/workers-shared/middlewares/onError.js';
import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { XIdentityRoute } from '@/x/src/identity/route.js';

const x = new Hono().route('/identity', XIdentityRoute);

const app = new Hono().use(prettyJSON()).use(withCors()).route('/x', x).onError(onError);

export default app;
export type AppType = typeof app;
