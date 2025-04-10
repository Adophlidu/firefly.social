import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { ChannelInList } from '@/components/ChannelInList.js';
import { Link } from '@/components/Link.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SearchType } from '@/constants/enum.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { getSuggestedChannels } from '@/services/getSuggestedChannels.js';

interface SuggestChannelListProps {
    query: string;
    onSelect?: () => void;
}

export const SuggestChannelList = memo<SuggestChannelListProps>(function SuggestChannelList({ query, onSelect }) {
    const profileIds = useCurrentProfileIds();
    const { data: channels, isLoading } = useQuery({
        queryKey: ['search-suggest', 'channels', query, ...profileIds],
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: () => getSuggestedChannels(query),
        enabled: !!query,
    });

    return (
        <div>
            <h2 className="border-t border-line p-3 pb-2 text-sm font-bold leading-[18px]">
                <Trans>Channels</Trans>
            </h2>
            {isLoading ? (
                <div className="flex flex-col items-center space-y-2 px-4 pb-5 pt-2 text-center text-sm font-bold">
                    <LoadingIcon />
                    <div className="font-bold">
                        <Trans>Searching channel</Trans>
                    </div>
                </div>
            ) : channels?.length ? (
                channels.map((channel) => (
                    <ChannelInList
                        className="!border-0 !py-2"
                        hideDescription
                        channel={channel}
                        key={channel.id}
                        onClick={onSelect}
                    />
                ))
            ) : (
                <div className="space-y-2 px-4 py-4 text-center text-sm font-bold">
                    <div className="font-bold">
                        <Trans>No matching channel</Trans>
                    </div>
                </div>
            )}
            <div className="px-3 pb-4 pt-2">
                <Link
                    className="my-4 text-sm leading-[18px] text-secondary"
                    href={resolveSearchUrl(query, SearchType.Communities)}
                >
                    <Trans>Show more channels</Trans>
                </Link>
            </div>
        </div>
    );
});
