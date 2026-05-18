import { Source } from '@dimensiondev/enums';
import type { SocialSource } from '@/constants/enum.js';
import { useAllConnections } from '@/hooks/useAllConnections.js';
import { useProfileStoreAll } from '@/hooks/useProfileStore.js';

const maxAccountCountPeerSource: Record<SocialSource, number> = {
    [Source.Farcaster]: 3,
    [Source.Lens]: 3,
    [Source.Bsky]: 3,
    [Source.Twitter]: 3,
};

export function useCanBindMoreAccount(source: SocialSource) {
    const profileStore = useProfileStoreAll();
    const { data, isLoading, isRefetching, ...rest } = useAllConnections();

    const maxCount = maxAccountCountPeerSource[source];
    const connectedCount = data?.social[source].connected.length || 0;
    const loggedInCount = profileStore[source].accounts.length;

    return {
        ...rest,
        isLoading,
        isRefetching,
        data: isLoading || isRefetching || !data ? false : connectedCount < maxCount && loggedInCount < maxCount,
    };
}
