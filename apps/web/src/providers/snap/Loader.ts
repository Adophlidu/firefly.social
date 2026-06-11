import type { Snap, SnapDigestedResponse } from '@dimensiondev/workers-snap';

import { createWorkerLoader } from '@/providers/base/createWorkerLoader.js';

export const SnapLoader = createWorkerLoader<Snap, SnapDigestedResponse>('/fc-snap', (data) => data.snap);
