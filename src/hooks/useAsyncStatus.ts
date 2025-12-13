import { SORTED_SOCIAL_SOURCES } from '@/constants/computed.js';
import { AsyncStatus, type SocialSource, Source } from '@/constants/enum.js';
import { useProfileStoreAll } from '@/hooks/useProfileStore.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import { useThirdPartyProfileStore } from '@/store/useProfileStore/useThirdPartyProfileStore.js';

export function useAsyncStatusAll(status = AsyncStatus.Pending) {
    const store = useProfileStoreAll();
    const asyncStatus = useGlobalState.use.asyncStatus();
    const thirdPartyStatus = useThirdPartyProfileStore.use.status();
    return (
        SORTED_SOCIAL_SOURCES.some((x) => store[x].status === status || asyncStatus[x] === status) ||
        thirdPartyStatus === status ||
        asyncStatus[Source.Firefly] === status
    );
}

export function useAsyncStatus(source: SocialSource, status = AsyncStatus.Pending) {
    const store = useProfileStoreAll();
    const asyncStatus = useGlobalState.use.asyncStatus();

    return store[source].status === status || asyncStatus[source] === status;
}
