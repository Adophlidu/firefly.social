import { onError } from '@dimensiondev/workers-shared/middlewares/onError.js';
import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { SuggestedChannelsRoute } from '@/ui/src/suggested-channels/route.js';

const ui = new Hono().route('/', SuggestedChannelsRoute);

const app = new Hono().use(prettyJSON()).use(withCors()).route('/ui', ui).onError(onError);

export default app;
export type AppType = typeof app;
export type { FireflyChannel, SuggestedChannel } from './suggested-channels/types.js';
