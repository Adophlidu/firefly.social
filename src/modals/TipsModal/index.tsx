import { Trans } from '@lingui/react/macro';
import { useCallback, useState } from 'react';

import { TipsModelRouter, TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import { NetworkType, Source } from '@/constants/enum.js';
import { TIPS_SUPPORT_NETWORKS } from '@/constants/index.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type {
    FireflyIdentity,
    FireflyProfile,
    FireflyTipsProfile,
    Profile,
    WalletProfile,
} from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { useTipsStore } from '@/store/useTipsStore.js';

interface TipsModalOpenProps {
    identity: FireflyIdentity;
    profiles: FireflyProfile[];
    handle: string | null;
    pureWallet?: boolean;
    post?: Post;
}

type TipsModalCloseProps = {} | void;

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
            const { address, primary_ens, blockchain, avatar } = profile.__origin__ as WalletProfile;
            return {
                ...profile,
                displayName: primary_ens || formatAddressEthereum(address, 8),
                address,
                avatar,
                ens: primary_ens || undefined,
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

interface TipModalProps {
    ref: React.Ref<SingletonModalRefCreator<TipsModalOpenProps, TipsModalCloseProps>>;
}

export function TipsModal({ ref }: TipModalProps) {
    const { reset, update, open } = useTipsStore();
    const [initialEntries, setInitialEntries] = useState<TipsRoutePath[]>([]);

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
                if (!walletProfiles.length) {
                    setInitialEntries([TipsRoutePath.NO_AVAILABLE_WALLET]);
                } else {
                    setInitialEntries([TipsRoutePath.TIPS]);
                    update({
                        recipientList: walletProfiles,
                        recipient: walletProfiles[0],
                        identity,
                        post: post ?? null,
                        handle:
                            identity.source === Source.Wallet && !handle
                                ? formatWalletHandle(walletProfiles, identity.id)
                                : handle,
                        pureWallet,
                        socialProfiles,
                    });
                }
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

    return <TipsModelRouter onClose={onClose} open={open} initialEntries={initialEntries} />;
}

export const TipsModalRef = new SingletonModal<TipsModalOpenProps, TipsModalCloseProps>();
