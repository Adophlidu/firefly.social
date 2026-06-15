import { frameWorker } from '@dimensiondev/workers-client';

import { createWorkerLoader } from '@/providers/base/createWorkerLoader.js';
import type { Frame, LinkDigestedResponse } from '@/types/frame.js';

export const FrameLoader = createWorkerLoader<Frame, LinkDigestedResponse>(
    (link) => frameWorker.frame.$url({ query: { link } }).toString(),
    (data) => data.frame,
);
