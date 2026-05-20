import type { CharTag, SocialSource } from '@dimensiondev/enums';

import type { RP_HASH_TAG } from '@/constants/static.js';
import type { Profile } from '@/providers/types/Firefly.js';

interface Segment {
    // tag is used to identify the type of content
    tag: CharTag;
    // if visible is false, content will not be displayed
    // but the length of content will be counted
    visible: boolean;
    // content is the actual content
    content: string;
    // sortNo is used to sort the content
    sortNo?: number;
}

interface RP_Chars extends Segment {
    tag: CharTag.FIREFLY_RP;
    visible: boolean;
    content: typeof RP_HASH_TAG;
}

export interface MentionChars extends Segment {
    tag: CharTag.MENTION;
    visible: boolean;
    content: string;
    profiles: Profile[];
}

interface FrameChars extends Segment {
    id: string;
    tag: CharTag.FRAME;
    visible: boolean;
    // content is not used
    content: never;
}

export interface PromoteLinkChars extends Segment {
    tag: CharTag.PROMOTE_LINK;
}

interface PostLinkChars extends Segment {
    tag: CharTag.POST_LINK;
    content: string;
    source: SocialSource;
}

export type ComplexChars = RP_Chars | MentionChars | FrameChars | PromoteLinkChars | PostLinkChars;
export type Chars = string | Array<string | ComplexChars>;
