import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { SizeofRoute } from '@/sizeof/src/route.js';

const app = new Hono();

app.use(prettyJSON());
app.use(withCors());

app.route('/sizeof', SizeofRoute);

export default app;
export type AppType = typeof app;
export type { ImageDigested } from './types.js';
