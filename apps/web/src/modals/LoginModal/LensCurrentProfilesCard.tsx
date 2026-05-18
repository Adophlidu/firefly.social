'use client';

import { Source } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import type { SocialSource } from '@/constants/enum.js';
import { STALE_TIMES } from '@/constants/query.js';
import { MAX_ACCOUNT_COUNT_PER_SOURCE } from '@/constants/static.js';
import { CurrentProfilesCard } from '@/modals/LoginModal/CurrentProfilesCard.js';
import { autoLoginLensAccounts } from '@/providers/lens/autoLoginLensAccounts.js';
import type { Account } from '@/providers/types/Account.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';

interface Props {
    source: SocialSource;
    accounts: Account[];
    connectedProfiles: Profile[];
    index: number;
    loading?: boolean;
}

export const LensCurrentProfilesCard = memo<Props>(function LensCurrentProfilesCard(props) {
    const { currentProfileSession } = useFireflyProfileStore();
    const lensAccounts = useLensProfileStore.use.accounts();
    const { isLoading, isRefetching } = useQuery({
        queryKey: ['auto-login', Source.Lens, currentProfileSession?.profileId],
        staleTime: STALE_TIMES.MINUTE_5,

        retry: false,
        enabled: !!currentProfileSession && lensAccounts.length < MAX_ACCOUNT_COUNT_PER_SOURCE,
        queryFn: async () => {
            const result = await runInSafeAsync(() => autoLoginLensAccounts());
            return result || null;
        },
    });

    return <CurrentProfilesCard {...props} loading={isLoading || isRefetching} />;
});
