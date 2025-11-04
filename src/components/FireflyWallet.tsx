'use client';

import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useEffect, useMemo } from 'react';
import type { Address } from 'viem';

import ArrowLineDownIcon from '@/assets/arrow-line-down.svg';
import WalletIcon from '@/assets/wallet.svg';
import { NetworkType, WalletSource } from '@/constants/enum.js';
import { useAllConnections } from '@/hooks/useAllConnections.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export const FIREFLY_WALLET_IFRAME_ID = `firefly-wallet-iframe`;

export function FireflyWallet() {
    const isLoginFirefly = useIsLoginFirefly();
    const isOpen = useGlobalState.use.fireflyWalletIsOpen();

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

    if (!isLoginFirefly) return null;

    return (
        <>
            <div
                className={classNames(
                    'fixed bottom-4 right-4 z-50 size-[calc(100%-32px)] max-h-[600px] max-w-[390px] origin-bottom-right overflow-hidden rounded-xl bg-primaryBottom bg-bottom pt-14 text-main shadow-lg duration-300',
                    {
                        'scale-0 opacity-0': !isOpen,
                    },
                )}
            >
                <div className="absolute left-0 top-0 flex h-14 w-full items-center justify-between whitespace-nowrap bg-lightBg px-5">
                    {isOpen ? (
                        <>
                            <div className="flex items-center text-medium font-medium">
                                <WalletIcon width={24} height={24} className="mr-2" />
                                <Trans>Wallet</Trans>
                            </div>
                            <button
                                className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-bg"
                                onClick={() => useGlobalState.getState().updateFireflyWalletIsOpen(false)}
                            >
                                <ArrowLineDownIcon width={20} height={20} />
                            </button>
                        </>
                    ) : null}
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
                    'fixed bottom-4 right-4 z-50 flex size-12 origin-bottom-right items-center justify-center rounded-2xl bg-lightBg text-main shadow-lg duration-150',
                    isOpen ? 'pointer-events-none scale-[3] opacity-0' : 'cursor-pointer',
                )}
                onClick={() => useGlobalState.getState().updateFireflyWalletIsOpen(true)}
            >
                <WalletIcon />
            </button>
        </>
    );
}
