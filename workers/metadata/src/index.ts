import { onError } from '@dimensiondev/workers-shared/middlewares/onError.js';
import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

const metadataV2 = new Hono();

const app = new Hono().use(prettyJSON()).use(withCors()).route('/metadata-v2', metadataV2).onError(onError);

export default app;
export type AppType = typeof app;
