import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { SuggestedChannelsRoute } from '@/ui-suggested-channels/src/route.js';

const app = new Hono();

app.use(prettyJSON());
app.use(withCors());

app.route('/ui', SuggestedChannelsRoute);

export default app;
export type AppType = typeof app;
