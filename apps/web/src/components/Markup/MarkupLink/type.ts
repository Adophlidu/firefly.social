import type { AnchorHTMLAttributes } from 'react';

import type { SocialSource } from '@/constants/enum.js';
import type { Post, Profile } from '@/providers/types/SocialMedia.js';

export interface MarkupLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    title?: string;
    post?: Post;
    source?: SocialSource;
    sourceLink?: string;
    profile?: Profile;
}
