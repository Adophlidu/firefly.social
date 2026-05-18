'use client';

import { ExploreType } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';

import { AsideTitle } from '@/components/AsideTitle.js';
import { Avatar } from '@/components/Avatar.js';
import { ChannelTippy } from '@/components/Channel/ChannelTippy.js';
import { Link } from '@/components/Link.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { SuggestedChannelsSkeleton } from '@/components/SuggestedChannels/SuggestedChannelsSkeleton.js';
import { STALE_TIMES } from '@/constants/query.js';
import { getChannelUrl } from '@/helpers/getChannelUrl.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { getTrendingChannels } from '@/providers/firefly/worker/getTrendingChannels.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

function SuggestedChannelItem({ channel }: { channel: Channel }) {
    return (
        <ChannelTippy channel={channel}>
            <Link
                className="bg-lightBottom dark:bg-primaryBottom inline-flex h-6 items-center gap-1 rounded-full px-3"
                href={getChannelUrl(channel)}
            >
                <Avatar className="rounded-full" src={channel.imageUrl} size={15} alt={channel.name} />
                <span className="text-medium text-main font-bold">{channel.name}</span>
                <SocialSourceIcon mono source={channel.source} size={15} className="text-secondary shrink-0" />
            </Link>
        </ChannelTippy>
    );
}

export function SuggestedChannelsCard() {
    const profileIds = useCurrentProfileIds();
    const { data, isLoading, isError } = useQuery({
        queryKey: ['suggest-channels', ...profileIds],
        staleTime: STALE_TIMES.MINUTE_5,

        queryFn: () => getTrendingChannels(),
    });

    if (isError) return null;
    if (isLoading) return <SuggestedChannelsSkeleton />;
    if (!data?.length) return null;

    return (
        <section>
            <AsideTitle
                caption={<Trans>Trending Clubs</Trans>}
                more={
                    <Link className="text-medium text-highlight" href={resolveExploreUrl(ExploreType.TopChannels)}>
                        <Trans>More</Trans>
                    </Link>
                }
            />
            <div className="bg-lightBg flex flex-wrap gap-2.5 rounded-xl p-3">
                {data.map((channel) => (
                    <SuggestedChannelItem key={channel.id} channel={channel} />
                ))}
            </div>
        </section>
    );
}
