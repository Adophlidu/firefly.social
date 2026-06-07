import { FIREFLY_WORKER_HOST } from '@dimensiondev/constants/static';
import type { AppType as IframeBlockerAppType } from '@dimensiondev/workers-iframe-blocker';
import type { AppType as MetadataAppType } from '@dimensiondev/workers-metadata';
import type { AppType as OembedAppType } from '@dimensiondev/workers-oembed';
import type { AppType as OgAppType } from '@dimensiondev/workers-og';
import type { AppType as S3AppType } from '@dimensiondev/workers-s3';
import type { AppType as TokenAppType } from '@dimensiondev/workers-token';
import type { AppType as UiSuggestedChannelsAppType } from '@dimensiondev/workers-ui-suggested-channels';
import type { AppType as XIdentityAppType } from '@dimensiondev/workers-x-identity';
import { hc } from 'hono/client';

export const tokenWorker = hc<TokenAppType>(FIREFLY_WORKER_HOST);
export const ogWorker = hc<OgAppType>(FIREFLY_WORKER_HOST);
export const oembedWorker = hc<OembedAppType>(FIREFLY_WORKER_HOST);
export const iframeBlockerWorker = hc<IframeBlockerAppType>(FIREFLY_WORKER_HOST);
export const xIdentityWorker = hc<XIdentityAppType>(FIREFLY_WORKER_HOST);
export const uiSuggestedChannelsWorker = hc<UiSuggestedChannelsAppType>(FIREFLY_WORKER_HOST);
export const s3Worker = hc<S3AppType>(FIREFLY_WORKER_HOST);
export const metadataWorker = hc<MetadataAppType>(FIREFLY_WORKER_HOST);
