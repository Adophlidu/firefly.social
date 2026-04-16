import FireflyRoundIcon from '@dimensiondev/assets/firefly.round.svg';
import SelectedIcon from '@dimensiondev/assets/selected.svg';
import { formatAddress } from '@dimensiondev/web3/utils';
import { useWallets as useEvmWallets } from '@privy-io/react-auth';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { useAppKitSolanaWallets } from '@/hooks/useAppKitSolanaWallets.js';
import { SwapAccessPath } from '@/store/swap/swapState.js';

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
    externalSolanaAddress,
}: WalletFilterProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { wallets: evmWallets } = useEvmWallets();
    const { wallets: solanaWallets } = useSolanaWallets();
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
        const embeddedEvmItems: WalletItem[] = evmWallets
            .filter((w) => w.walletClientType === 'privy')
            .map((w) => ({
                address: w.address,
                isEmbedded: true,
                chainType: 'ethereum' as const,
                walletClientType: w.walletClientType,
                icon: w.meta.icon,
            }));

        const embeddedSolanaItems: WalletItem[] = solanaWallets
            .filter((w) => 'isPrivyWallet' in w.standardWallet && !!w.standardWallet.isPrivyWallet)
            .map((w) => ({
                address: w.address,
                isEmbedded: true,
                chainType: 'solana' as const,
                walletClientType: w.standardWallet.name,
                icon: w.standardWallet.icon,
            }));

        if (isInternalMode) {
            return [...embeddedEvmItems, ...embeddedSolanaItems];
        }

        const embeddedAddresses = new Set(
            [...embeddedEvmItems, ...embeddedSolanaItems].map((w) => w.address.toLowerCase()),
        );

        const externalEvmItems: WalletItem[] = evmWallets
            .filter((w) => w.walletClientType !== 'privy')
            .map((w) => ({
                address: w.address,
                isEmbedded: false,
                chainType: 'ethereum' as const,
                walletClientType: w.walletClientType,
                icon: w.meta.icon,
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
    }, [evmWallets, solanaWallets, appKitSolanaWallets, isInternalMode, externalEvmAddress, externalSolanaAddress]);

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
            className="bg-primaryBottom absolute right-0 top-full z-50 mt-1 overflow-hidden rounded-xl shadow-[0_8px_64px_0_rgba(0,0,0,0.1)]"
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
                <span className="text-main text-sm font-semibold">
                    {domainNameMap?.get(wallet.address.toLowerCase()) ??
                        domainNameMap?.get(wallet.address) ??
                        formatAddress(wallet.address, 4)}
                </span>
            </div>
            {isSelected ? <SelectedIcon className="text-lightTextMain size-6 shrink-0" /> : null}
        </button>
    );
});
