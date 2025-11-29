'use client';

import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useEffect, useMemo } from 'react';
import type { Address } from 'viem';

import ArrowLineDownIcon from '@/assets/arrow-line-down.svg';
import WalletIcon from '@/assets/wallet.svg';
import { NetworkType, PageRoute, WalletSource } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { useAllConnections } from '@/hooks/useAllConnections.js';
import { useIsCreatedPrivyWallet } from '@/hooks/useIsCreatedPrivyWallet.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export const FIREFLY_WALLET_IFRAME_ID = `firefly-wallet-iframe`;

export function FireflyWallet() {
    const isLoginFirefly = useIsLoginFirefly();
    const isOpen = useGlobalState.use.fireflyWalletIsOpen();
    const { isCreatedPrivyWallet } = useIsCreatedPrivyWallet();
    const pathname = usePathname();

    const allConnectionsQuery = useAllConnections();
    const privyConnections = useMemo(() => {
        if (!allConnectionsQuery.data) return [];
        const { connected } = allConnectionsQuery.data;
        return connected.filter((connection) => connection.source === WalletSource.Privy);
    }, [allConnectionsQuery.data]);
    useEffect(() => {
        for (const connection of privyConnections) {
            switch (connection.platform) {
                case 'eth':
                    useFireflyWalletStore
                        .getState()
                        .setWallet(NetworkType.Ethereum, [{ address: connection.address as Address }]);
                    break;
                case 'solana':
                    useFireflyWalletStore.getState().setWallet(NetworkType.Solana, [{ address: connection.address }]);
                    break;
                default:
                    safeUnreachable(connection.platform);
            }
        }
    }, [privyConnections]);

    if (!isLoginFirefly || !isCreatedPrivyWallet) return null;

    const isHidePath = pathname.startsWith(PageRoute.Settings) || pathname.startsWith(PageRoute.Explore);

    return (
        <>
            <div
                className={classNames(
                    'fixed bottom-0 left-1/2 h-0 w-full max-w-[1265px] -translate-x-1/2 duration-100',
                    isOpen ? 'z-50' : 'z-30',
                    {
                        'pointer-events-none translate-y-full opacity-0': isHidePath && !isOpen,
                    },
                )}
            >
                <div
                    className={classNames(
                        'absolute bottom-0 right-4 z-50 size-[calc(100%-32px)] h-[600px] max-w-[385px] origin-bottom-right overflow-hidden rounded-xl border border-line bg-primaryBottom bg-bottom pt-14 text-main shadow-lg duration-300 lg:right-0',
                        isOpen ? '-translate-y-4' : 'translate-y-[calc(100%-56px)] max-lg:scale-0 max-lg:opacity-0',
                    )}
                >
                    <div
                        className="absolute left-0 top-0 flex h-14 w-full items-center justify-between whitespace-nowrap border-b border-b-line bg-lightBg px-5"
                        onClick={() => {
                            if (!isOpen) {
                                useGlobalState.getState().updateFireflyWalletIsOpen(true);
                            }
                        }}
                    >
                        <div className="flex items-center text-medium font-medium">
                            <WalletIcon width={24} height={24} className="mr-2" />
                            <Trans>Wallet</Trans>
                        </div>
                        <button
                            className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-bg"
                            onClick={() => useGlobalState.getState().updateFireflyWalletIsOpen(false)}
                        >
                            <ArrowLineDownIcon
                                width={20}
                                height={20}
                                className={classNames({
                                    'rotate-180': !isOpen,
                                })}
                            />
                        </button>
                    </div>
                    <iframe
                        id={FIREFLY_WALLET_IFRAME_ID}
                        src={'/wallet-iframe'}
                        className={classNames('size-full duration-100', {
                            'opacity-0': !isOpen,
                        })}
                    />
                </div>
                <button
                    className={classNames(
                        'absolute bottom-4 right-4 z-50 flex size-12 origin-bottom-right items-center justify-center rounded-2xl bg-lightBg text-main shadow-lg duration-150 lg:right-0 lg:hidden',
                        isOpen ? 'pointer-events-none scale-[3] opacity-0' : 'cursor-pointer',
                    )}
                    onClick={() => useGlobalState.getState().updateFireflyWalletIsOpen(true)}
                >
                    <WalletIcon />
                </button>
            </div>
        </>
    );
}
