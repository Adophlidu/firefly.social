import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { ByBase64Route } from '@/s3/src/byBase64.js';
import { ByChunkRoute } from '@/s3/src/byChunk.js';

const app = new Hono();

app.use(prettyJSON());
app.use(withCors());

app.route('/s3/upload', ByBase64Route);
app.route('/s3/upload-chunk', ByChunkRoute);

export default app;
export type AppType = typeof app;
