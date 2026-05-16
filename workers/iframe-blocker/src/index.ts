import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { IframeBlockRoute } from '@/iframe-blocker/src/route.js';

const app = new Hono();

app.use(prettyJSON());
app.use(withCors());

app.route('/iframe-blocker', IframeBlockRoute);

export default app;
export type AppType = typeof app;
