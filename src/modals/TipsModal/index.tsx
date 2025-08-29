import { Trans } from '@lingui/react/macro';
import { useCallback } from 'react';

import { Modal } from '@/components/Modal.js';
import { Popover } from '@/components/Popover.js';
import { router, TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import { NetworkType, Source } from '@/constants/enum.js';
import { TIPS_SUPPORT_NETWORKS } from '@/constants/index.js';
import { dynamic } from '@/esm/dynamic.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { TipsContext, type TipsProfile } from '@/hooks/useTipsContext.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { TipsModalContentSkeleton } from '@/modals/TipsModal/TipsModalContentSkeleton.js';
import type { FireflyIdentity, FireflyProfile, Profile, WalletProfile } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';

const TipsModalContent = dynamic(() => import('@/modals/TipsModal/ModalContent.js').then((m) => m.TipsModalContent), {
    ssr: false,
    loading: () => <TipsModalContentSkeleton />,
});

export interface TipsModalOpenProps {
    identity: FireflyIdentity;
    profiles: FireflyProfile[];
    handle: string | null;
    pureWallet?: boolean;
    post?: Post;
}

export type TipsModalCloseProps = {} | void;

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

function formatWalletHandle(profiles: TipsProfile[], address: string) {
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

type Props = {
    ref: React.Ref<SingletonModalRefCreator<TipsModalOpenProps, TipsModalCloseProps>>;
};

function TipsModalUI({ ref }: Props) {
    const isMedium = useIsMedium();
    const { reset, update } = TipsContext.useContainer();
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: async ({ identity, handle, profiles, post, pureWallet = false }) => {
            // avoid UI flicker when closing
            reset();

            try {
                const { walletProfiles, socialProfiles } = formatTipsProfiles(profiles);

                walletProfiles.sort((a, b) => {
                    return (
                        getSortPriority(b.__origin__ as WalletProfile, handle) -
                        getSortPriority(a.__origin__ as WalletProfile, handle)
                    );
                });
                if (!walletProfiles.length) {
                    router.navigate({ to: TipsRoutePath.NO_AVAILABLE_WALLET });
                } else {
                    update((prev) => ({
                        ...prev,
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
                    }));
                    router.navigate({ to: TipsRoutePath.TIPS });
                }
            } catch (error) {
                enqueueMessageFromError(error, <Trans>Failed to send tip. Please try again later.</Trans>);
                throw error;
            }
        },
    });
    const onClose = useCallback(() => {
        dispatch?.close({});
    }, [dispatch]);

    if (isMedium) {
        return (
            <Modal open={open} onClose={onClose} disableScrollLock={false} disableDialogClose>
                <div className="z-10 w-4/5 rounded-md bg-lightBottom px-3 py-6 text-medium text-lightMain shadow-popover transition-all dark:bg-darkBottom md:w-[485px] md:rounded-xl md:px-6">
                    <TipsModalContent />
                </div>
            </Modal>
        );
    }

    return (
        <Popover open={open} onClose={onClose} dialogPanelClassName="!p-0 !pt-6">
            <div className="px-3 pb-6 text-medium text-lightMain">
                <TipsModalContent />
            </div>
        </Popover>
    );
}

export function TipsModal({ ref, ...props }: Props) {
    return (
        <TipsContext.Provider>
            <TipsModalUI {...props} ref={ref} />
        </TipsContext.Provider>
    );
}

export const TipsModalRef = new SingletonModal<TipsModalOpenProps, TipsModalCloseProps>();
