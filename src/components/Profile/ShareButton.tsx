'use client';

import urlcat from 'urlcat';

import ShareIcon from '@/assets/share.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { SITE_URL } from '@/constants/static.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { useCopyText } from '@/hooks/useCopyText.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function ShareButton({ profile }: { profile: Profile }) {
    const [, handleCopy] = useCopyText(urlcat(SITE_URL, getProfileUrl(profile)));
    return (
        <ClickableButton
            className="inline-flex size-8 items-center justify-center rounded-lg bg-lightBg text-second active:opacity-50 md:hover:opacity-60"
            onClick={() => handleCopy()}
        >
            <ShareIcon />
        </ClickableButton>
    );
}
