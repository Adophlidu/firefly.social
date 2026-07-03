import { FIREFLY_WORKER_HOST } from '@dimensiondev/constants/static';
import type { AppType as BskyAppType } from '@dimensiondev/workers-bsky';
import type { AppType as EnsAppType } from '@dimensiondev/workers-ens';
import type { AppType as FarcasterAppType } from '@dimensiondev/workers-farcaster';
import type { AppType as FrameAppType } from '@dimensiondev/workers-frame';
import type { AppType as IframeBlockerAppType } from '@dimensiondev/workers-iframe-blocker';
import type { AppType as LensAppType } from '@dimensiondev/workers-lens';
import type { AppType as MetadataAppType } from '@dimensiondev/workers-metadata';
import type { AppType as OembedAppType } from '@dimensiondev/workers-oembed';
import type { AppType as OgAppType } from '@dimensiondev/workers-og';
import type { AppType as ProxyImageAppType } from '@dimensiondev/workers-proxy-image';
import type { AppType as S3AppType } from '@dimensiondev/workers-s3';
import type { AppType as SizeofAppType } from '@dimensiondev/workers-sizeof';
import type { AppType as SnapAppType } from '@dimensiondev/workers-snap';
import type { AppType as SnapshotAppType } from '@dimensiondev/workers-snapshot';
import type { AppType as TcoAppType } from '@dimensiondev/workers-tco';
import type { AppType as TokenAppType } from '@dimensiondev/workers-token';
import type { AppType as UiAppType } from '@dimensiondev/workers-ui';
import type { AppType as UnifiBadgeLevelAppType } from '@dimensiondev/workers-unifi-badge-level';
import type { AppType as XAppType } from '@dimensiondev/workers-x';
import { hc } from 'hono/client';

// ────────────────────────────────────────────────────────────────────────────
// RPC clients — one typed Hono client per worker apps/web talks to.
// `AppType` is used type-only, so no worker runtime is ever bundled.
// ────────────────────────────────────────────────────────────────────────────
export const bskyWorker = hc<BskyAppType>(FIREFLY_WORKER_HOST);
export const ensWorker = hc<EnsAppType>(FIREFLY_WORKER_HOST);
export const farcasterWorker = hc<FarcasterAppType>(FIREFLY_WORKER_HOST);
export const frameWorker = hc<FrameAppType>(FIREFLY_WORKER_HOST);
export const iframeBlockerWorker = hc<IframeBlockerAppType>(FIREFLY_WORKER_HOST);
export const lensWorker = hc<LensAppType>(FIREFLY_WORKER_HOST);
export const metadataWorker = hc<MetadataAppType>(FIREFLY_WORKER_HOST);
export const oembedWorker = hc<OembedAppType>(FIREFLY_WORKER_HOST);
export const ogWorker = hc<OgAppType>(FIREFLY_WORKER_HOST);
export const proxyImageWorker = hc<ProxyImageAppType>(FIREFLY_WORKER_HOST);
export const s3Worker = hc<S3AppType>(FIREFLY_WORKER_HOST);
export const sizeofWorker = hc<SizeofAppType>(FIREFLY_WORKER_HOST);
export const snapWorker = hc<SnapAppType>(FIREFLY_WORKER_HOST);
export const snapshotWorker = hc<SnapshotAppType>(FIREFLY_WORKER_HOST);
export const tcoWorker = hc<TcoAppType>(FIREFLY_WORKER_HOST);
export const tokenWorker = hc<TokenAppType>(FIREFLY_WORKER_HOST);
export const uiWorker = hc<UiAppType>(FIREFLY_WORKER_HOST);
export const unifiBadgeLevelWorker = hc<UnifiBadgeLevelAppType>(FIREFLY_WORKER_HOST);
export const xWorker = hc<XAppType>(FIREFLY_WORKER_HOST);

// ────────────────────────────────────────────────────────────────────────────
// Worker `AppType`s — every worker, aliased `<Name>AppType`, so callers can build
// their own clients without importing each worker package directly.
// ────────────────────────────────────────────────────────────────────────────
export type {
    BskyAppType,
    EnsAppType,
    FarcasterAppType,
    FrameAppType,
    IframeBlockerAppType,
    LensAppType,
    MetadataAppType,
    OembedAppType,
    OgAppType,
    ProxyImageAppType,
    S3AppType,
    SizeofAppType,
    SnapAppType,
    SnapshotAppType,
    TcoAppType,
    TokenAppType,
    UiAppType,
    UnifiBadgeLevelAppType,
    XAppType,
};
