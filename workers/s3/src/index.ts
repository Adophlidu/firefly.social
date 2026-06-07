import { onError } from '@dimensiondev/workers-shared/middlewares/onError.js';
import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { ByBase64Route } from '@/s3/src/byBase64.js';
import { ByChunkRoute } from '@/s3/src/byChunk.js';

const app = new Hono()
    .use(prettyJSON())
    .use(withCors())
    .route('/s3/upload', ByBase64Route)
    .route('/s3/upload-chunk', ByChunkRoute)
    .onError(onError);

export default app;
export type AppType = typeof app;
export type { MediaToken } from './schema.js';
