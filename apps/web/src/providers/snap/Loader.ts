import { snapWorker } from '@dimensiondev/workers-client';
import type { Snap, SnapDigestedResponse } from '@dimensiondev/workers-snap';

import { createWorkerLoader } from '@/providers/base/createWorkerLoader.js';

export const SnapLoader = createWorkerLoader<Snap, SnapDigestedResponse>(
    (link) => snapWorker['fc-snap'].$url({ query: { link } }).toString(),
    (data) => data.snap,
);
