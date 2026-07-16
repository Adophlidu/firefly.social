'use client';

import ShareIcon from '@dimensiondev/assets/share.svg';
import { SITE_URL } from '@dimensiondev/envs/web';
import urlcat from 'urlcat';

import { ClickableButton } from '@/components/ClickableButton.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { useCopyText } from '@/hooks/useCopyText.js';
import { useShareUrl } from '@/hooks/useShareUrl.js';
import { useShortShareUrl } from '@/hooks/useShortShareUrl.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function ShareButton({ profile }: { profile: Profile }) {
    const baseUrl = urlcat(SITE_URL, getProfileUrl(profile));
    const longUrl = useShareUrl(baseUrl);
    const { isPending, register } = useShortShareUrl(longUrl);
    const [, handleCopy] = useCopyText(longUrl);
    return (
        <ClickableButton
            loading={isPending}
            onlyLoading
            loadingSize={16}
            className="inline-flex size-8 items-center justify-center rounded-lg bg-lightBg text-second active:opacity-50 md:hover:opacity-60"
            onClick={async () => {
                const resolvedUrl = await register();
                handleCopy(resolvedUrl);
            }}
        >
            <ShareIcon />
        </ClickableButton>
    );
}
