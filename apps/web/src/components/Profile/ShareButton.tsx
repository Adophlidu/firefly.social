'use client';

import ShareIcon from '@dimensiondev/assets/share.svg';
import urlcat from 'urlcat';

import { ClickableButton } from '@/components/ClickableButton.js';
import { SITE_URL } from '@/constants/static.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { useCopyText } from '@/hooks/useCopyText.js';
import { useShareUrl } from '@/hooks/useShareUrl.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function ShareButton({ profile }: { profile: Profile }) {
    const baseUrl = urlcat(SITE_URL, getProfileUrl(profile));
    const url = useShareUrl(baseUrl);
    const [, handleCopy] = useCopyText(url);
    return (
        <ClickableButton
            className="bg-lightBg text-second inline-flex size-8 items-center justify-center rounded-lg active:opacity-50 md:hover:opacity-60"
            onClick={() => handleCopy()}
        >
            <ShareIcon />
        </ClickableButton>
    );
}
