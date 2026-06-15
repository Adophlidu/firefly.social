import { oembedWorker } from '@dimensiondev/workers-client';

import { createWorkerLoader } from '@/providers/base/createWorkerLoader.js';
import type { LinkDigested, OpenGraph } from '@/types/og.js';

export const OpenGraphLoader = createWorkerLoader<OpenGraph, LinkDigested>(
    (link) => oembedWorker.oembed.$url({ query: { link } }).toString(),
    (data) => data.og,
);
