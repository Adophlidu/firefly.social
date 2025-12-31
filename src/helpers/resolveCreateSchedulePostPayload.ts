import { createLookupTableResolver , UnreachableError } from '@dimensiondev/utils';

import { type SocialSource, Source } from '@/constants/enum.js';
import {
    createFarcasterSchedulePostPayload,
    type FarcasterSchedulePostPayload,
} from '@/providers/farcaster/createFarcasterSchedulePostPayload.js';
import {
    createLensSchedulePostPayload,
    type LensSchedulePayload,
} from '@/providers/lens/createLensSchedulePostPayload.js';
import {
    createTwitterSchedulePostPayload,
    type TwitterSchedulePostPayload,
} from '@/providers/twitter/createTwitterSchedulePostPayload.js';
import type { ComposeType, CompositePost } from '@/types/compose.js';

export type SchedulePayload = LensSchedulePayload | FarcasterSchedulePostPayload | TwitterSchedulePostPayload;

type payloadCreator = (
    type: ComposeType,
    compositePost: CompositePost,
    isThread?: boolean,
    signal?: AbortSignal,
) => Promise<SchedulePayload>;

export const resolveCreateSchedulePostPayload = createLookupTableResolver<SocialSource, payloadCreator>(
    {
        [Source.Lens]: createLensSchedulePostPayload,
        [Source.Farcaster]: createFarcasterSchedulePostPayload,
        [Source.Twitter]: createTwitterSchedulePostPayload,
        [Source.Bsky]: createTwitterSchedulePostPayload,
    },
    (source: SocialSource) => {
        throw new UnreachableError('source', source);
    },
);
