import type { SocialSource } from '@dimensiondev/enums';

import type { Channel, Post } from '@/providers/types/SocialMedia.js';
import type { Chars } from '@/types/chars.js';
import type { ComposeType, CompositePost, MediaObject } from '@/types/compose.js';

export interface ComposeModalOpenProps {
    type?: ComposeType;
    chars?: Chars;
    embeds?: string[];
    images?: MediaObject[];
    source?: SocialSource | SocialSource[];
    post?: Post | null;
    channel?: Channel | null;
    initialPath?: string;
    isFailedSchedulePost?: boolean;
    isAnonymous?: boolean;
    disabledSources?: SocialSource[];
    disableSchedule?: boolean;
}

export type ComposeModalCloseProps = {
    post?: CompositePost;
} | void;
