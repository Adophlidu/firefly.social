import type { SocialSource } from '@dimensiondev/enums';
import { cache } from 'react';

import { compactProfileForPageTransfer } from '@/helpers/compactProfileForPageTransfer.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export const getSocialProfileByHandlePageData = cache(
    async (source: SocialSource, handle: string): Promise<Profile | null> => {
        const profile = await resolveSocialMediaProvider(source).getProfileByHandle(handle, true);
        return compactProfileForPageTransfer(profile);
    },
);
