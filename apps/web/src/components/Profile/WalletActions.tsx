'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { isValidAddressEthereum, isValidAddressSolana } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import urlcat from 'urlcat';

import { ClickableButton } from '@/components/ClickableButton.js';
import { NoSSR } from '@/components/NoSSR.js';
import { HackedButton } from '@/components/Profile/HackedButton.js';
import { WalletMoreAction } from '@/components/Profile/WalletMoreAction.js';
import { WatchButton } from '@/components/Profile/WatchButton.js';
import { NetworkType, Source } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/static.js';
import { isMPCWallet } from '@/helpers/isMPCWallet.js';
import { openWindow } from '@/helpers/openWindow.js';
import { useIsMyRelatedProfile } from '@/hooks/useIsMyRelatedProfile.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { captureFireflyWalletEvent } from '@/providers/telemetry/captureFireflyWalletEvent.js';
import { type WalletProfile, WalletProfileDataSource } from '@/providers/types/Firefly.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export function WalletActions({ profile }: { profile: WalletProfile }) {
    const isMyWallets = useIsMyRelatedProfile(Source.Wallet, profile.address);
    const isMedium = useIsMedium();

    if (isMyWallets && isMPCWallet(profile)) {
        const type = isValidAddressEthereum(profile.address)
            ? NetworkType.Ethereum
            : isValidAddressSolana(profile.address, false)
              ? NetworkType.Solana
              : undefined;
        return (
            <ClickableButton
                onClick={() => {
                    if (!profile.dataSource) return;
                    captureFireflyWalletEvent(EventId.FIREFLY_WALLET_OPEN_SUCCESS, {
                        wallet_address: profile.address,
                        MPC_type: WalletProfileDataSource.Privy,
                    });

                    switch (profile.dataSource) {
                        case WalletProfileDataSource.Particle:
                            openWindow(urlcat(SITE_URL, '/particle-recovery', { type }));
                            break;
                        case WalletProfileDataSource.Privy:
                            useGlobalState.getState().updateFireflyWalletIsOpen(true);
                            break;
                        default:
                            safeUnreachable(profile.dataSource);
                    }
                }}
                className="bg-highlight text-medium text-primaryBottom dark:text-main ml-auto mr-1 flex h-8 min-w-[100px] items-center justify-center rounded-lg px-2 font-semibold transition-all hover:opacity-80"
            >
                <Trans>Open</Trans>
            </ClickableButton>
        );
    }
    if (isMyWallets) return null;

    if (profile.hacked) return <HackedButton className="ml-auto" />;

    return (
        <NoSSR>
            <WatchButton
                className="ml-auto mr-1 max-md:min-w-[50px]"
                watchButtonClassName="!bg-highlight dark:text-main"
                watchingButtonClassName="!text-highlight"
                address={profile.address}
                ens={profile.primary_ens ?? undefined}
                variant={isMedium ? 'text' : 'icon'}
            />
            <WalletMoreAction profile={profile} />
        </NoSSR>
    );
}
