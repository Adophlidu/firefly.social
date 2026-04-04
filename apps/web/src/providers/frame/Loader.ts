import { createWorkerLoader } from '@/providers/base/createWorkerLoader.js';
import { type Frame, type LinkDigestedResponse } from '@/types/frame.js';

export const FrameLoader = createWorkerLoader<Frame, LinkDigestedResponse>('/frame', (data) => data.frame);
