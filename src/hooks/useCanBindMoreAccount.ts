import { type SocialSource, Source } from '@/constants/enum.js';
import { useAllConnections } from '@/hooks/useAllConnections.js';

const maxAccountCountPeerSource: Record<SocialSource, number> = {
    [Source.Farcaster]: 3,
    [Source.Lens]: 3,
    [Source.Bsky]: 3,
    [Source.Twitter]: 3,
};

export function useCanBindMoreAccount(source: SocialSource) {
    const { data, isLoading, isRefetching, ...rest } = useAllConnections();

    return {
        ...rest,
        isLoading,
        isRefetching,
        data:
            isLoading || isRefetching || !data
                ? false
                : data.social[source].connected.length < maxAccountCountPeerSource[source],
    };
}
