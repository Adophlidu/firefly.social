import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { OembedRoute } from '@/oembed/src/route.js';

const app = new Hono();

app.use(prettyJSON());
app.use(withCors());

app.route('/oembed', OembedRoute);

export default app;
export type AppType = typeof app;
