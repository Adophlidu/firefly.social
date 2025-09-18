import { useQuery } from '@tanstack/react-query';
import { useAsyncFn } from 'react-use';

import { queryClient } from '@/configs/queryClient.js';
import { ExploreSwitchType } from '@/constants/enum.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { GetExploreSwitchConfigResponse } from '@/providers/types/Firefly.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

function updateQuery(accountId: string | number, switchType: ExploreSwitchType, status: boolean) {
    queryClient.setQueryData<GetExploreSwitchConfigResponse['data']>(['explore-switch', accountId], (data) => {
        if (!data) return data;
        return {
            ...data,
            list: data.list.map((x) => {
                if (x.title === 'Explore') {
                    return {
                        ...x,
                        list: x.list.map((y) => {
                            if (y.explore_type === switchType) {
                                return { ...y, state: status };
                            }
                            return y;
                        }),
                    };
                }

                return x;
            }),
        };
    });
}

export function useExploreDataSwitchConfig(switchType: ExploreSwitchType, updateStateBeforeApi = false) {
    const { currentProfileSession } = useFireflyProfileStore();
    const accountId = currentProfileSession?.profileId;

    const { isLoading, data } = useQuery({
        queryKey: ['explore-switch', accountId],
        enabled: !!accountId,
        staleTime: 1000 * 60 * 60,
        queryFn: () => FireflyEndpointProvider.getExploreSwitchConfigList(),
    });

    const [{ loading }, toggleSwitch] = useAsyncFn(
        async (newStatus: boolean) => {
            try {
                if (!accountId) {
                    throw new Error('No firefly account found.');
                }
                if (updateStateBeforeApi) {
                    updateQuery(accountId, switchType, newStatus);
                }
                await FireflyEndpointProvider.setExploreSwitchConfig(ExploreSwitchType.TruthSocial, newStatus);
                if (!updateStateBeforeApi) {
                    updateQuery(accountId, switchType, newStatus);
                }
            } catch (error) {
                if (accountId) {
                    updateQuery(accountId, switchType, !newStatus);
                }
                throw error;
            }
        },
        [switchType, accountId, updateStateBeforeApi],
    );

    const exploreConfig = data?.list.find((x) => x.title === 'Explore');

    return {
        loading: isLoading || loading,
        status: exploreConfig?.list.find((x) => x.explore_type === switchType)?.state ?? false,
        toggleSwitch,
    };
}
