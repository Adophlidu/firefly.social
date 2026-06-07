import { onError } from '@dimensiondev/workers-shared/middlewares/onError.js';
import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { TokenRoute } from '@/token/src/route.js';

const app = new Hono().use(prettyJSON()).use(withCors()).route('/token', TokenRoute).onError(onError);

export default app;
export type AppType = typeof app;
export type {
    CoinGeckoCoinMarketInfo,
    CoinGeckoToken,
    GetTokenOptions,
    SearchableToken,
    TokenWithMarket,
} from './types.js';
export { TokenPlatformType } from '@dimensiondev/enums';
