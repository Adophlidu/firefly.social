import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { PockerRoute } from '@/pocker-labs/src/route.js';

const app = new Hono();

app.use(prettyJSON());
app.use(withCors());

app.route('/pocker-labs', PockerRoute);

export default app;
export type AppType = typeof app;
