'use client';

import ArrowLineDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import MoreIcon from '@dimensiondev/assets/more-fill.svg';
import ReloadIcon from '@dimensiondev/assets/reload.svg';
import WalletIcon from '@dimensiondev/assets/wallet.svg';
import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useCallback, useEffect, useMemo } from 'react';
import { useUpdateEffect } from 'react-use';
import { type Address } from 'viem';

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
    const { isAuthorized, setWallet } = useFireflyWalletStore();
    const { updateFireflyWalletIsOpen } = useGlobalState();
    const allConnectionsQuery = useAllConnections();

    const handleRefresh = useCallback(() => {
        const iframe = document.getElementById(FIREFLY_WALLET_IFRAME_ID) as HTMLIFrameElement | null;
        if (iframe) {
            iframe.contentWindow?.location.reload();
        }
    }, []);

    const privyConnections = useMemo(() => {
        if (!allConnectionsQuery.data) return [];
        const { connected } = allConnectionsQuery.data;
        return connected.filter((connection) => connection.source === WalletSource.Privy);
    }, [allConnectionsQuery.data]);

    useEffect(() => {
        if (!isAuthorized) return;

        for (const connection of privyConnections) {
            switch (connection.platform) {
                case 'eth':
                    setWallet(NetworkType.Ethereum, [{ address: connection.address as Address }]);
                    break;
                case 'solana':
                    setWallet(NetworkType.Solana, [{ address: connection.address }]);
                    break;
                default:
                    safeUnreachable(connection.platform);
            }
        }
    }, [privyConnections, isAuthorized, setWallet]);

    const isHidePath = pathname.startsWith(PageRoute.Settings);

    useUpdateEffect(() => {
        if (isHidePath && isOpen) {
            updateFireflyWalletIsOpen(false);
        }
    }, [isHidePath, isOpen, updateFireflyWalletIsOpen]);

    if (!isLoginFirefly || !isCreatedPrivyWallet) return null;

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
                        { 'translate-y-[calc(100%-56px)] max-lg:scale-0 max-lg:opacity-0': !isOpen },
                    )}
                >
                    <div
                        className="absolute left-0 top-0 flex h-14 w-full items-center justify-between whitespace-nowrap border-b border-b-line bg-lightBg px-5"
                        onClick={() => {
                            if (!isOpen) {
                                updateFireflyWalletIsOpen(true);
                            }
                        }}
                    >
                        <div className="flex items-center text-medium font-medium">
                            <WalletIcon width={24} height={24} className="mr-2" />
                            <Trans>Firefly Wallet</Trans>
                        </div>
                        <div className="flex items-center gap-2">
                            {isOpen ? (
                                <Menu as="div" className="relative" onClick={(e) => e.stopPropagation()}>
                                    <MenuButton className="flex size-6 cursor-pointer items-center justify-center rounded-full border border-secondaryLine bg-bg text-main">
                                        <MoreIcon width={12} height={12} />
                                    </MenuButton>
                                    <MenuItems
                                        portal
                                        anchor="bottom end"
                                        className="z-50 flex w-max min-w-[110px] flex-col overflow-hidden rounded-lg border border-line bg-primaryBottom py-3 text-base text-main shadow-lg"
                                    >
                                        <MenuItem>
                                            {({ close }) => (
                                                <button
                                                    className="flex cursor-pointer items-center gap-2 px-3 py-1 hover:bg-bg"
                                                    onClick={() => {
                                                        close();
                                                        handleRefresh();
                                                    }}
                                                >
                                                    <ReloadIcon width={18} height={18} className="-scale-x-100" />
                                                    <span className="text-base font-bold">
                                                        <Trans>Refresh</Trans>
                                                    </span>
                                                </button>
                                            )}
                                        </MenuItem>
                                    </MenuItems>
                                </Menu>
                            ) : null}
                            <button
                                className="flex size-6 cursor-pointer items-center justify-center rounded-full border border-secondaryLine bg-bg"
                                onClick={() => updateFireflyWalletIsOpen(!isOpen)}
                            >
                                <ArrowLineDownIcon
                                    width={12}
                                    height={12}
                                    className={classNames({
                                        'rotate-180': !isOpen,
                                    })}
                                />
                            </button>
                        </div>
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
                    onClick={() => updateFireflyWalletIsOpen(true)}
                >
                    <WalletIcon />
                </button>
            </div>
        </>
    );
}
