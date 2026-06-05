'use client';

import MoreIcon from '@dimensiondev/assets/more-fill.svg';
import { SEVEN_DAYS } from '@dimensiondev/constants/static';
import { Source } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import { ETH_ZERO_ADDRESS } from '@dimensiondev/web3/constants';
import { isSameEthereumAddress } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { skipToken, useQuery } from '@tanstack/react-query';
import { first } from 'lodash-es';
import { memo, useMemo } from 'react';
import { useAsyncFn } from 'react-use';
import { useConnection } from 'wagmi';

import { IconButton } from '@/components/IconButton.js';
import { STALE_TIMES } from '@/constants/query.js';
import { openAndWaitForCloseAddLensManagerModal } from '@/controllers/openAddLensManagerModal.js';
import { enqueueErrorMessage, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { createMemorySessionClient } from '@/providers/lens/createMemorySessionClient.js';
import { ensureLensResultSync } from '@/providers/lens/ensureLensResultSync.js';
import { getProfilesByAddress } from '@/providers/lens/getProfilesByAddress.js';
import { LensSession } from '@/providers/lens/Session.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';

interface Props {
    profile: Profile;
}

export const LensAccountActions = memo<Props>(function LensAccountActions({ profile }) {
    const connection = useConnection();
    const lensAccounts = useLensProfileStore.getState().accounts;
    const currentProfile = useLensProfileStore.getState().currentProfile;
    const { wallets } = useFireflyWalletStore();

    const account = useMemo(
        () => lensAccounts.find((account) => isSameProfile(account.profile, profile)),
        [lensAccounts, profile],
    );

    const privyEvm = first(wallets.ethereum)?.address;
    const isOwnerConnected =
        connection.isConnected && isSameEthereumAddress(connection.address, profile.ownedBy?.address);
    const disabled = !isOwnerConnected || !account || !privyEvm;

    const { data, isLoading, isRefetching } = useQuery({
        queryKey: [Source.Lens, 'profiles', privyEvm?.toLowerCase()],
        enabled: !disabled,
        staleTime: STALE_TIMES.MINUTE_5,

        queryFn: !privyEvm ? skipToken : () => getProfilesByAddress(privyEvm),
    });
    const { data: signerAddress } = useQuery({
        queryKey: [Source.Lens, 'signer', account?.session.profileId],
        staleTime: 0,
        enabled: !disabled,
        queryFn: !account
            ? skipToken
            : async () => {
                  const sessionClient = await createMemorySessionClient(account.session as LensSession);
                  const signer = ensureLensResultSync(sessionClient.getAuthenticatedUser())?.signer;
                  return signer ?? null;
              },
    });

    const [{ loading }, onMoreButtonClick] = useAsyncFn(async () => {
        const lastSession = account?.session as LensSession | undefined;
        if (!privyEvm || !lastSession) return;

        const isCurrentProfile = isSameProfile(currentProfile, profile);
        const sessionClient = isCurrentProfile
            ? undefined
            : await runInSafeAsync(() => createMemorySessionClient(lastSession));

        try {
            if (!isCurrentProfile && !sessionClient) throw new Error('Failed to create session client.');

            const result = await openAndWaitForCloseAddLensManagerModal({
                manager: privyEvm,
                sessionClient,
                profile,
            });
            if (result) {
                enqueueSuccessMessage(<Trans>Successfully bound Lens manager.</Trans>);
            }
        } catch (error) {
            enqueueErrorMessage(<Trans>Failed to bind Lens manager, please try again later.</Trans>, { error });
        } finally {
            if (sessionClient && account) {
                // update session if updated
                try {
                    const credentials = ensureLensResultSync(sessionClient.getCredentials());
                    if (credentials && credentials.accessToken !== lastSession.token) {
                        const now = Date.now();
                        const newSession = new LensSession(
                            lastSession.profileId,
                            credentials.accessToken,
                            now,
                            now + SEVEN_DAYS,
                            credentials.refreshToken,
                            lastSession.address ?? ETH_ZERO_ADDRESS,
                            credentials.idToken,
                        );
                        useLensProfileStore.getState().addAccount(
                            {
                                ...account,
                                session: newSession,
                            },
                            false,
                        );
                    }
                } catch {}
            }
        }
    }, [profile, privyEvm, account, currentProfile]);

    const isAlreadyBound = data?.some((x) => isSameProfile(x, profile));
    if (
        disabled ||
        isAlreadyBound ||
        isLoading ||
        isRefetching ||
        (!!signerAddress && !isSameEthereumAddress(signerAddress, connection.address))
    )
        return null;

    return (
        <IconButton onlyLoading loading={loading} tooltip={<Trans>Lens Auto login</Trans>} onClick={onMoreButtonClick}>
            <MoreIcon width={20} height={20} className="size-5 shrink-0 text-second" />
        </IconButton>
    );
});
