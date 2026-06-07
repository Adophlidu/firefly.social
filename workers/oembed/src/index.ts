import { onError } from '@dimensiondev/workers-shared/middlewares/onError.js';
import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { OembedRoute } from '@/oembed/src/route.js';

const app = new Hono().use(prettyJSON()).use(withCors()).route('/oembed', OembedRoute).onError(onError);

export default app;
export type AppType = typeof app;
export type { ImageDigested, LinkDigested, OpenGraph, OpenGraphImage } from './types.js';
