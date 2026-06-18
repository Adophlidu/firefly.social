import { MAX_ACCOUNT_COUNT_PER_SOURCE } from '@dimensiondev/constants/static';
import { Source } from '@dimensiondev/enums';
import { isSameEthereumAddress } from '@dimensiondev/web3/utils';
import { compact } from 'lodash-es';

import { queryClient } from '@/configs/queryClient.js';
import { ensureCreatedFireflyWallet } from '@/helpers/ensureCreatedFireflyWallet.js';
import { queryMyAllConnections } from '@/helpers/queryMyAllConnections.js';
import { logger } from '@/libs/Logger.js';
import { autoLoginProfileWithPrivy } from '@/providers/lens/autoLoginWithPrivy.js';
import { getProfilesByAddress } from '@/providers/lens/getProfilesByAddress.js';
import { updateLensAccounts } from '@/providers/lens/updateLensAccounts.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';

interface Options {
    updateStore?: boolean;
}

export async function autoLoginLensAccounts({ updateStore = true }: Options = {}) {
    // 1. check firefly session
    const lastFireflyAccountId = useFireflyProfileStore.getState().currentProfileSession?.profileId;
    if (!lastFireflyAccountId) {
        logger.warn('No firefly session found.');
        return;
    }

    // 2. get privy evm wallet
    const privyEvmAddress = (await ensureCreatedFireflyWallet('eth'))?.address;
    if (!privyEvmAddress) {
        logger.warn('No privy evm wallet found.');
        return;
    }

    // 3. ensure current profiles count less than max
    const lensProfiles = useLensProfileStore.getState().accounts.map((x) => x.profile);
    if (lensProfiles.length >= MAX_ACCOUNT_COUNT_PER_SOURCE) {
        logger.warn('Reached max lens accounts limit.');
        return;
    }

    // 4. get managed profiles by privy wallet and filter those already logged in
    const managedProfiles = await getProfilesByAddress(privyEvmAddress);
    const { social } = await queryClient.ensureQueryData(queryMyAllConnections);
    const filteredManagedProfiles = managedProfiles.filter((profile) => {
        const connectedAccounts = (social[Source.Lens]?.connected || []).flatMap((x) => x.lens || []);
        return (
            !lensProfiles.some((x) => isSameEthereumAddress(x.profileId, profile.profileId)) &&
            connectedAccounts.some((x) => isSameEthereumAddress(x.id, profile.profileId))
        );
    });
    if (!filteredManagedProfiles.length) {
        logger.warn('No managed lens profiles found to login.');
        return;
    }

    // 5. auto login with privy
    const loginResult = await Promise.allSettled(
        filteredManagedProfiles
            .slice(0, MAX_ACCOUNT_COUNT_PER_SOURCE - lensProfiles.length)
            .map((profile) => autoLoginProfileWithPrivy(profile, privyEvmAddress)),
    );
    const newAccounts = compact(
        loginResult.map((result) => (result.status === 'fulfilled' ? result.value.account : null)),
    );
    if (!newAccounts.length) {
        logger.warn('No lens accounts logged in successfully.');
        return;
    }

    // 6. verify firefly session is still the same
    const latestFireflySession = useFireflyProfileStore.getState().currentProfileSession;
    if (latestFireflySession?.profileId !== lastFireflyAccountId) {
        logger.warn('Firefly session changed during lens auto login.');
        return;
    }

    // 7. update profile store
    if (updateStore) {
        updateLensAccounts(newAccounts);
    }

    return newAccounts;
}
