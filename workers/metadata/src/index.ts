import { withCors } from '@dimensiondev/workers-shared/middlewares/withCors.js';
import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';

import { ArticleMetadataRoute } from '@/metadata/src/article/route.js';
import { ChannelMetadataRoute } from '@/metadata/src/channel/route.js';
import { CollectionMetadataRoute } from '@/metadata/src/collection/route.js';
import { EventMetadataRoute } from '@/metadata/src/event/route.js';
import { FireflyProfileMetadataRoute } from '@/metadata/src/firefly-profile/route.js';
import { NftMetadataRoute } from '@/metadata/src/nft/route.js';
import { PostMetadataRoute } from '@/metadata/src/post/route.js';
import { PredictionMetadataRoute } from '@/metadata/src/prediction/route.js';
import { ProfileMetadataRoute } from '@/metadata/src/profile/route.js';
import { SparksAccountMetadataRoute } from '@/metadata/src/sparks-account/route.js';
import { TokenMetadataRoute } from '@/metadata/src/token/route.js';
import { TransactionMetadataRoute } from '@/metadata/src/transaction/route.js';
import { WalletProfileMetadataRoute } from '@/metadata/src/wallet-profile/route.js';

const app = new Hono();

app.use(prettyJSON());
app.use(withCors());

const metadataV2 = new Hono();

metadataV2.route('/', ArticleMetadataRoute);
metadataV2.route('/', ChannelMetadataRoute);
metadataV2.route('/', CollectionMetadataRoute);
metadataV2.route('/', EventMetadataRoute);
metadataV2.route('/', FireflyProfileMetadataRoute);
metadataV2.route('/', NftMetadataRoute);
metadataV2.route('/', PostMetadataRoute);
metadataV2.route('/', PredictionMetadataRoute);
metadataV2.route('/', ProfileMetadataRoute);
metadataV2.route('/', SparksAccountMetadataRoute);
metadataV2.route('/', TokenMetadataRoute);
metadataV2.route('/', TransactionMetadataRoute);
metadataV2.route('/', WalletProfileMetadataRoute);

app.route('/metadata-v2', metadataV2);

export default app;
export type AppType = typeof app;
