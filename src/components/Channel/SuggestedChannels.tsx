'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';

import { AsideTitle } from '@/components/AsideTitle.js';
import { Avatar } from '@/components/Avatar.js';
import { ChannelTippy } from '@/components/Channel/ChannelTippy.js';
import { Link } from '@/components/Link.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { ExploreType, Source } from '@/constants/enum.js';
import { getChannelUrl } from '@/helpers/getChannelUrl.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import { getTrendingChannels } from '@/services/getTrendingChannels.js';

function SuggestedChannelItem({ channel }: { channel: Channel }) {
    return (
        <ChannelTippy channel={channel}>
            <Link
                className="inline-flex h-6 items-center gap-1 rounded-full bg-lightBottom px-3 dark:bg-primaryBottom"
                href={getChannelUrl(channel)}
            >
                <Avatar className="rounded-full" src={channel.imageUrl} size={15} alt={channel.name} />
                <span className="text-medium font-bold text-main">{channel.name}</span>
                <SocialSourceIcon mono source={channel.source} size={15} className="flex-shrink-0 text-secondary" />
            </Link>
        </ChannelTippy>
    );
}

export function SuggestedChannels() {
    const profileIds = useCurrentProfileIds();
    const { data, isLoading, isError } = useQuery({
        queryKey: ['suggest-channels', ...profileIds],
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: () => getTrendingChannels([Source.Farcaster, Source.Bsky, Source.Lens]),
    });

    if (isError || isLoading || !data?.length) return null;

    return (
        <section>
            <AsideTitle className="flex items-center justify-between">
                <span className="text-xl">
                    <Trans>Trending Channels</Trans>
                </span>
                <Link
                    className="text-medium text-highlight"
                    href={resolveExploreUrl(ExploreType.TopChannels, Source.Farcaster)}
                >
                    <Trans>More</Trans>
                </Link>
            </AsideTitle>
            <div className="flex flex-wrap gap-2.5 rounded-xl bg-lightBg p-3">
                {data.map((channel) => (
                    <SuggestedChannelItem key={channel.id} channel={channel} />
                ))}
            </div>
        </section>
    );
}
