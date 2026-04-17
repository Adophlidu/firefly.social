import { createWorkerLoader } from '@/providers/base/createWorkerLoader.js';
import type { Snap, SnapDigestedResponse } from '@/types/snap.js';

export const SnapLoader = createWorkerLoader<Snap, SnapDigestedResponse>('/fc-snap', (data) => data.snap);
