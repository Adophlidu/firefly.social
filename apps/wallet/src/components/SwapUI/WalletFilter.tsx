import FireflyRoundIcon from '@dimensiondev/assets/firefly.round.svg';
import SelectedIcon from '@dimensiondev/assets/selected.svg';
import { PRIVY_CONNECTOR_ID } from '@dimensiondev/constants/static';
import { SwapAccessPath } from '@dimensiondev/enums';
import { formatAddress } from '@dimensiondev/web3/utils';
import { first } from 'lodash-es';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useConnections } from 'wagmi';

import { walletConnectIcon } from '@/constants/reown.js';
import { useAppKitSolanaWallets } from '@/hooks/useAppKitSolanaWallets.js';
import { usePrivyWallet } from '@/hooks/usePrivyWallet.js';

export interface WalletItem {
    address: string;
    isEmbedded: boolean;
    chainType: 'ethereum' | 'solana';
    walletClientType?: string;
    icon?: string;
}

interface WalletFilterProps {
    open: boolean;
    onClose: () => void;
    selectedAddress: string | null;
    onSelect: (address: string) => void;
    chainId: number | null;
    domainNameMap?: Map<string, string>;
    accessPath: SwapAccessPath;
    externalEvmAddress?: string | null;
    externalEvmIcon?: string | null;
    externalEvmName?: string | null;
    externalSolanaAddress?: string | null;
}

export const WalletFilter = memo(function WalletFilter({
    open,
    onClose,
    selectedAddress,
    onSelect,
    chainId: _chainId,
    domainNameMap,
    accessPath,
    externalEvmAddress,
    externalEvmIcon,
    externalEvmName,
    externalSolanaAddress,
}: WalletFilterProps) {
    const ref = useRef<HTMLDivElement>(null);
    const connections = useConnections();
    const { solanaAddress } = usePrivyWallet();
    const appKitSolanaWallets = useAppKitSolanaWallets();

    // Close on click outside
    useEffect(() => {
        if (!open) return;

        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open, onClose]);

    // Determine if we're in internal mode (WalletGUI) or external mode (TokenDetail or CopyTrade)
    const isInternalMode = accessPath === SwapAccessPath.WalletGUI;

    // Build wallet list - always include both EVM and Solana wallets
    const wallets = useMemo((): WalletItem[] => {
        const embeddedEvmItems: WalletItem[] = connections
            .filter((w) => w.connector.id === PRIVY_CONNECTOR_ID)
            .map((w) => ({
                address: first(w.accounts),
                isEmbedded: true,
                chainType: 'ethereum' as const,
                walletClientType: w.connector.name,
                icon: w.connector.icon,
            }));

        const embeddedSolanaItems: WalletItem[] = solanaAddress
            ? [
                  {
                      address: solanaAddress,
                      isEmbedded: true,
                      chainType: 'solana' as const,
                      walletClientType: 'Privy',
                  },
              ]
            : [];

        if (isInternalMode) {
            return [...embeddedEvmItems, ...embeddedSolanaItems];
        }

        const embeddedAddresses = new Set(
            [...embeddedEvmItems, ...embeddedSolanaItems].map((w) => w.address.toLowerCase()),
        );

        const externalEvmItems: WalletItem[] = connections
            .filter((w) => w.connector.id !== PRIVY_CONNECTOR_ID)
            .map((w) => ({
                address: first(w.accounts),
                isEmbedded: false,
                chainType: 'ethereum' as const,
                walletClientType: w.connector.name,
                icon: w.connector.icon,
            }));

        const externalSolanaItems: WalletItem[] = appKitSolanaWallets
            .filter((w) => !embeddedAddresses.has(w.address.toLowerCase()))
            .map((w) => ({
                address: w.address,
                isEmbedded: false,
                chainType: 'solana' as const,
                walletClientType: w.name,
                icon: w.icon,
            }));

        const externalWalletItems: WalletItem[] = [];
        if (externalEvmAddress && !embeddedAddresses.has(externalEvmAddress.toLowerCase())) {
            // Check if not already in externalEvmItems
            if (!externalEvmItems.some((w) => w.address.toLowerCase() === externalEvmAddress.toLowerCase())) {
                externalWalletItems.push({
                    address: externalEvmAddress,
                    isEmbedded: false,
                    chainType: 'ethereum' as const,
                    walletClientType: externalEvmName ?? 'WalletConnect',
                    icon: externalEvmIcon ?? undefined,
                });
            }
        }
        if (externalSolanaAddress && !embeddedAddresses.has(externalSolanaAddress.toLowerCase())) {
            // Check if not already in externalSolanaItems
            if (!externalSolanaItems.some((w) => w.address.toLowerCase() === externalSolanaAddress.toLowerCase())) {
                externalWalletItems.push({
                    address: externalSolanaAddress,
                    isEmbedded: false,
                    chainType: 'solana' as const,
                    walletClientType: 'WalletConnect',
                    icon: walletConnectIcon,
                });
            }
        }

        return [
            ...embeddedEvmItems,
            ...embeddedSolanaItems,
            ...externalEvmItems,
            ...externalSolanaItems,
            ...externalWalletItems,
        ];
    }, [
        connections,
        solanaAddress,
        appKitSolanaWallets,
        isInternalMode,
        externalEvmAddress,
        externalEvmIcon,
        externalEvmName,
        externalSolanaAddress,
    ]);

    const handleSelect = useCallback(
        (address: string) => {
            onSelect(address);
            onClose();
        },
        [onSelect, onClose],
    );

    if (!open || wallets.length === 0) return null;

    return (
        <div
            ref={ref}
            className="absolute right-0 top-full z-50 mt-1 overflow-hidden rounded-xl bg-primaryBottom shadow-[0_8px_64px_0_rgba(0,0,0,0.1)]"
        >
            {wallets.map((wallet) => (
                <WalletMenuItem
                    key={`${wallet.chainType}-${wallet.address}`}
                    wallet={wallet}
                    isSelected={selectedAddress === wallet.address}
                    onSelect={handleSelect}
                    domainNameMap={domainNameMap}
                />
            ))}
        </div>
    );
});

interface WalletMenuItemProps {
    wallet: WalletItem;
    isSelected: boolean;
    onSelect: (address: string) => void;
    domainNameMap?: Map<string, string>;
}

const WalletMenuItem = memo(function WalletMenuItem({
    wallet,
    isSelected,
    onSelect,
    domainNameMap,
}: WalletMenuItemProps) {
    return (
        <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-4 py-[11px]"
            onClick={() => onSelect(wallet.address)}
        >
            <div className="flex items-center gap-2">
                {wallet.isEmbedded ? (
                    <FireflyRoundIcon className="size-6 shrink-0" />
                ) : wallet.icon ? (
                    <img src={wallet.icon} alt="" className="size-6 shrink-0 rounded-full" />
                ) : (
                    <FireflyRoundIcon className="size-6 shrink-0" />
                )}
                <span className="text-sm font-semibold text-main">
                    {domainNameMap?.get(wallet.address.toLowerCase()) ??
                        domainNameMap?.get(wallet.address) ??
                        formatAddress(wallet.address, 4)}
                </span>
            </div>
            {isSelected ? <SelectedIcon className="size-6 shrink-0 text-lightTextMain" /> : null}
        </button>
    );
});
