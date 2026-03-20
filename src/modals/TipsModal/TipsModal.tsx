import { Trans } from '@lingui/react/macro';
import { type Ref, useCallback, useMemo } from 'react';

import { TipsModelRouter, TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import { TIPS_SUPPORT_NETWORKS } from '@/constants/computed.js';
import { NetworkType, Source } from '@/constants/enum.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { getEnsNameFromWalletProfile } from '@/helpers/getEnsNameFromWalletProfile.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { type TipsModalRefType } from '@/modals/TipsModal/refs.js';
import {
    type FireflyProfile,
    type FireflyTipsProfile,
    type Profile,
    type WalletProfile,
} from '@/providers/types/Firefly.js';
import { useTipsStore } from '@/store/useTipsStore.js';

function formatTipsProfiles(profiles: FireflyProfile[]) {
    const socialProfiles = profiles
        .filter(({ identity }) => identity.source !== Source.Wallet)
        .map(
            (p) =>
                ({
                    platform: p.identity.source.toLowerCase(),
                    handle: p.displayName,
                }) as unknown as Profile,
        );
    const walletProfiles = profiles
        .filter((profile) => {
            const origin = profile.__origin__ as WalletProfile;
            return profile.identity.source === Source.Wallet && TIPS_SUPPORT_NETWORKS.includes(origin.blockchain);
        })
        .map((profile) => {
            const { address, blockchain, avatar } = profile.__origin__ as WalletProfile;
            const ens = getEnsNameFromWalletProfile(profile.__origin__ as WalletProfile);
            return {
                ...profile,
                displayName: ens || formatAddressEthereum(address, 8),
                address,
                avatar,
                ens,
                networkType: blockchain,
            };
        });
    return { walletProfiles, socialProfiles };
}

function formatWalletHandle(profiles: FireflyTipsProfile[], address: string) {
    const profile = profiles.find((profile) => isSameEthereumAddress(profile.address, address))
        ?.__origin__ as WalletProfile;
    return profile?.primary_ens ?? formatAddressEthereum(address, 4);
}

function getSortPriority(walletProfile: WalletProfile, handle: string | null) {
    const { blockchain, isDefault, primary_ens } = walletProfile;
    if (isDefault && blockchain === NetworkType.Ethereum) return 5;
    if (isDefault && blockchain === NetworkType.Solana) return 4;
    if (primary_ens && primary_ens === handle) return 3;
    if (primary_ens) return 2;
    return 1;
}

interface Props {
    ref: Ref<TipsModalRefType>;
}

export function TipsModal({ ref }: Props) {
    const { reset, update, open, recipientList } = useTipsStore();

    const [, dispatch] = useSingletonModal(ref, {
        onOpen: ({ identity, handle, profiles, post, pureWallet = false }) => {
            // avoid UI flicker when closing
            reset();

            try {
                const { walletProfiles, socialProfiles } = formatTipsProfiles(profiles);

                walletProfiles.sort(
                    (a, b) =>
                        getSortPriority(b.__origin__ as WalletProfile, handle) -
                        getSortPriority(a.__origin__ as WalletProfile, handle),
                );
                update({
                    recipientList: walletProfiles,
                    recipient: walletProfiles[0] || null,
                    identity,
                    post: post ?? null,
                    handle:
                        identity.source === Source.Wallet && !handle
                            ? formatWalletHandle(walletProfiles, identity.id)
                            : handle,
                    pureWallet,
                    socialProfiles,
                });
            } catch (error) {
                enqueueMessageFromError(error, <Trans>Failed to send tip. Please try again later.</Trans>);
                throw error;
            } finally {
                update({ open: true });
            }
        },
        onClose: () => {
            update({ open: false });
        },
    });

    const onClose = useCallback(() => {
        dispatch?.close();
    }, [dispatch]);

    const hasRecipients = recipientList.length;
    const initialEntries = useMemo(
        () => (hasRecipients ? [TipsRoutePath.TIPS] : [TipsRoutePath.NO_AVAILABLE_WALLET]),
        [hasRecipients],
    );

    return <TipsModelRouter onClose={onClose} open={open} initialEntries={initialEntries} />;
}
