import type { SocialSource } from '@dimensiondev/enums';

import type { MetadataAttribute } from '@/providers/lens/metadata/Base.js';
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
    /** LPT-1 tags + position attributes for an Orb comment (Lens root post). */
    lpt1Tags?: string[];
    lpt1Attributes?: MetadataAttribute[];
    /**
     * Lock the compose to a plain single root post: hide the thread "+", poll,
     * schedule, and red-packet actions (media / GIF / emoji are kept). Used for
     * Orb (LPT-1) comments.
     */
    lockThread?: boolean;
}

export type ComposeModalCloseProps = {
    post?: CompositePost;
} | void;
