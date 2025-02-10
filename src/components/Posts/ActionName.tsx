'use client';

import { Trans } from '@lingui/react/macro';
import { safeUnreachable } from '@masknet/kit';

import { type SocialSource, Source } from '@/constants/enum.js';

export function ActionName({ source }: { source: SocialSource }) {
    switch (source) {
        case Source.Bsky:
            return <Trans>Repost</Trans>;
        case Source.Twitter:
            return <Trans>Retweet</Trans>;
        case Source.Farcaster:
        case Source.Lens:
            return <Trans>Mirror</Trans>;
        default:
            safeUnreachable(source);
            return null;
    }
}
