'use client';

import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { type SocialSource, Source } from '@/constants/enum.js';
import { MAX_ACCOUNT_COUNT_PER_SOURCE } from '@/constants/static.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
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
    const { isFetching, isPending } = useQuery({
        queryKey: ['auto-login', Source.Lens, currentProfileSession?.profileId],
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!currentProfileSession && lensAccounts.length < MAX_ACCOUNT_COUNT_PER_SOURCE,
        queryFn: async () => {
            const result = await runInSafeAsync(() => autoLoginLensAccounts());
            return result || null;
        },
    });

    return <CurrentProfilesCard {...props} loading={isFetching || isPending} />;
});
