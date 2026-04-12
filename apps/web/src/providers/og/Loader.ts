import { createWorkerLoader } from '@/providers/base/createWorkerLoader.js';
import type { LinkDigested, OpenGraph } from '@/types/og.js';

export const OpenGraphLoader = createWorkerLoader<OpenGraph, LinkDigested>('/oembed', (data) => data.og);
