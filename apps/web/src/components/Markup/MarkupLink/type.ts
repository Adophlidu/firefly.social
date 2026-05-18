import type { SocialSource } from '@dimensiondev/enums';
import type { AnchorHTMLAttributes } from 'react';

import type { Post, Profile } from '@/providers/types/SocialMedia.js';

export interface MarkupLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    title?: string;
    post?: Post;
    source?: SocialSource;
    sourceLink?: string;
    profile?: Profile;
}
