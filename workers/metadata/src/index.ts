import { onError } from '@dimensiondev/workers-shared/middlewares/onError.js';
import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { ArticleMetadataRoute } from '@/metadata/src/article/route.js';
import { ChannelMetadataRoute } from '@/metadata/src/channel/route.js';
import { FireflyProfileMetadataRoute } from '@/metadata/src/firefly-profile/route.js';
import { PostMetadataRoute } from '@/metadata/src/post/route.js';
import { PredictionMetadataRoute } from '@/metadata/src/prediction/route.js';
import { ProfileMetadataRoute } from '@/metadata/src/profile/route.js';
import { TokenMetadataRoute } from '@/metadata/src/token/route.js';

const metadataV2 = new Hono()
    .route('/', ArticleMetadataRoute)
    .route('/', ChannelMetadataRoute)
    .route('/', FireflyProfileMetadataRoute)
    .route('/', PostMetadataRoute)
    .route('/', PredictionMetadataRoute)
    .route('/', ProfileMetadataRoute)
    .route('/', TokenMetadataRoute);

const app = new Hono().use(prettyJSON()).use(withCors()).route('/metadata-v2', metadataV2).onError(onError);

export default app;
export type AppType = typeof app;
