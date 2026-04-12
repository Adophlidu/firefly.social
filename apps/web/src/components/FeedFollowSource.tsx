'use client';

import FarcasterIcon from '@dimensiondev/assets/farcaster-fill.svg';
import LensIcon from '@dimensiondev/assets/lens-fill.svg';
import StarIcon from '@dimensiondev/assets/star.svg';
import TwitterIcon from '@dimensiondev/assets/x-fill.svg';
import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { ClickableArea } from '@/components/ClickableArea.js';
import { Link } from '@/components/Link.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { resolveWatchTypeToSource } from '@/helpers/resolveWatchTypeToSource.js';
import { type FollowingSource, WatchType } from '@/providers/types/Firefly.js';

export function FeedFollowSource({ source }: { source?: FollowingSource }) {
    if (!source) return null;
    if (![WatchType.Farcaster, WatchType.Lens, WatchType.Twitter, WatchType.Wallet].includes(source.type)) return null;

    const icons: { [key in WatchType]?: ReactNode } = {
        [WatchType.Lens]: <LensIcon className="mx-2 size-4" />,
        [WatchType.Farcaster]: <FarcasterIcon className="mx-2 size-4" />,
        [WatchType.Twitter]: <TwitterIcon className="mx-2 size-4" />,
    };

    const profileSource = resolveWatchTypeToSource(source.type);
    const profileUrl = getProfileUrl({ source: profileSource, profileId: source.id, handle: source.handle });

    return (
        <div className="text-medium text-second mb-3 flex items-center leading-6">
            <StarIcon className="mr-2 size-4" />
            {[WatchType.Farcaster, WatchType.Lens, WatchType.Twitter].includes(source.type) ? (
                <>
                    <Trans>Following</Trans>
                    {icons[source.type]}
                    {source.handle ? (
                        <ClickableArea>
                            <Link className="hover:underline" href={profileUrl}>
                                {source.handle}
                            </Link>
                        </ClickableArea>
                    ) : null}
                </>
            ) : WatchType.Wallet === source.type ? (
                <Trans>Address on Watching Lists</Trans>
            ) : null}
        </div>
    );
}
