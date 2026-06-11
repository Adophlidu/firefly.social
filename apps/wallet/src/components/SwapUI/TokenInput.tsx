import AddCircleLinearIcon from '@dimensiondev/assets/add-circle-linear.svg';
import ArrowDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import FireflyRoundIcon from '@dimensiondev/assets/firefly.round.svg';
import { PRIVY_CONNECTOR_ID } from '@dimensiondev/constants/static';
import { SwapFromPage } from '@dimensiondev/enums';
import { isSolanaChain } from '@dimensiondev/web3/chains';
import { isGreaterThan, isLessThan, minus, multipliedBy, plus, toFixed } from '@dimensiondev/web3/numbers';
import { formatAddress, isSameEthereumAddress } from '@dimensiondev/web3/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useAtomValue, useSetAtom } from 'jotai';
import { compact, first } from 'lodash-es';
import { type ChangeEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConnections } from 'wagmi';

import { WalletFilter } from '@/components/SwapUI/WalletFilter.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { Input } from '@/components/ui/input.js';
import { walletConnectIcon } from '@/constants/reown.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { formatTokenAmount, parseInputAmount } from '@/helpers/swap/formatSwapAmount.js';
import { useEffectiveSwapWalletAddress } from '@/hooks/swap/useEffectiveSwapWalletAddress.js';
import { useGoToSelectToken } from '@/hooks/swap/useGoToSelectToken.js';
import { useNativeTokenGasReserve } from '@/hooks/swap/useNativeTokenGasReserve.js';
import { useSwapQuote } from '@/hooks/swap/useSwapQuote.js';
import { useAppKitSolanaWallets } from '@/hooks/useAppKitSolanaWallets.js';
import { useSwapContextWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { useWalletDomainNames } from '@/hooks/useWalletDomainNames.js';
import { cn } from '@/lib/utils.js';
import { getDefaultSwapToken } from '@/providers/swap/defaultTokens.js';
import type { SwapToken } from '@/providers/swap/types.js';
import {
    accessPathAtom,
    externalEvmAddressAtom,
    externalEvmIconAtom,
    externalEvmNameAtom,
    externalSolanaAddressAtom,
    fromAddressAtom,
    fromAmountAtom,
    fromChainIdAtom,
    selectedPayWalletAtom,
    selectedReceiveWalletAtom,
    toAddressAtom,
    toChainIdAtom,
} from '@/store/swap/swapState.js';

export interface TokenInputProps {
    type: 'pay' | 'receive';
    token: SwapToken | null;
    chainId: number | null;
    amount?: string;
    usdValue?: number;
    balance?: string;
    loading?: boolean;
    disabled?: boolean;
    onAmountChange?: (amount: string) => void;
    autoFocus?: boolean;
    className?: string;
}

export const TokenInput = memo(function TokenInput({
    type,
    token,
    chainId,
    amount: _amount,
    usdValue,
    balance,
    loading,
    disabled = false,
    onAmountChange,
    autoFocus,
    className,
}: TokenInputProps) {
    const fromAmount = useAtomValue(fromAmountAtom);
    const { quote } = useSwapQuote();
    const toAmount = quote?.toAmount || '';

    const accessPath = useAtomValue(accessPathAtom);
    const externalEvmAddress = useAtomValue(externalEvmAddressAtom);
    const externalEvmIcon = useAtomValue(externalEvmIconAtom);
    const externalEvmName = useAtomValue(externalEvmNameAtom);
    const externalSolanaAddress = useAtomValue(externalSolanaAddressAtom);

    const setSelectedPayWallet = useSetAtom(selectedPayWalletAtom);
    const setSelectedReceiveWallet = useSetAtom(selectedReceiveWalletAtom);
    const setFromAmount = useSetAtom(fromAmountAtom);
    const setFromAddress = useSetAtom(fromAddressAtom);
    const setToAddress = useSetAtom(toAddressAtom);
    const setFromChainId = useSetAtom(fromChainIdAtom);
    const setToChainId = useSetAtom(toChainIdAtom);

    const [walletFilterOpen, setWalletFilterOpen] = useState(false);

    const { evmAddress, solanaAddress, isPrivyReady } = useSwapContextWalletAddresses();
    const domainNameMap = useWalletDomainNames(evmAddress, solanaAddress);
    const walletNameMap = useMemo(() => {
        const map = new Map(domainNameMap);
        if (externalEvmAddress && externalEvmName) {
            map.set(externalEvmAddress.toLowerCase(), externalEvmName);
            map.set(externalEvmAddress, externalEvmName);
        }
        return map;
    }, [domainNameMap, externalEvmAddress, externalEvmName]);
    const connections = useConnections();
    const appKitSolanaWallets = useAppKitSolanaWallets();

    const displayAmount = type === 'pay' ? fromAmount : toAmount;
    const isEditable = type === 'pay' && !disabled;

    // Track previous wallet type for reset logic
    const prevWalletTypeRef = useRef<'evm' | 'solana' | null>(null);

    const walletAddress = useEffectiveSwapWalletAddress(type, chainId);

    const isExternalEvmWallet =
        !!walletAddress && !!externalEvmAddress && isSameEthereumAddress(walletAddress, externalEvmAddress);
    const isExternalSolanaWallet =
        !!walletAddress && !!externalSolanaAddress && walletAddress === externalSolanaAddress;
    const hasWallet = !!walletAddress && (isPrivyReady || isExternalEvmWallet || isExternalSolanaWallet);

    const { gasReserve, isLoading: isGasReserveLoading } = useNativeTokenGasReserve(
        isEditable ? token : null,
        isEditable ? chainId : null,
    );

    // Detect wallet type change and reset state
    useEffect(() => {
        if (!walletAddress) return;

        // Check if the wallet is an EVM wallet by looking at all known EVM addresses
        const allEvmAddresses = new Set(
            compact([evmAddress, externalEvmAddress, ...connections.map((w) => first(w.accounts)?.toLowerCase())]),
        );

        const isSolanaAddress = !allEvmAddresses.has(walletAddress.toLowerCase());
        const newWalletType = isSolanaAddress ? 'solana' : 'evm';

        // Check if this is a wallet type switch
        if (prevWalletTypeRef.current !== null && prevWalletTypeRef.current !== newWalletType) {
            // Only reset when the current chain doesn't already match the new wallet type.
            // This prevents overwriting state after a swap flip (where chain & wallet change together).
            const currentChainType = isSolanaChain(chainId) ? 'solana' : 'evm';

            if (currentChainType !== newWalletType) {
                const newChainId = isSolanaAddress ? 501 : 1; // Solana mainnet (501) or Ethereum mainnet (1)
                const defaults = getDefaultSwapToken(newChainId);
                if (defaults) {
                    if (type === 'pay') {
                        setFromAmount('');
                        setFromAddress(defaults.first.contractAddress);
                        setFromChainId(newChainId);
                    } else {
                        setToAddress(defaults.second.contractAddress);
                        setToChainId(newChainId);
                    }
                }
            }
        }

        prevWalletTypeRef.current = newWalletType;
    }, [
        walletAddress,
        evmAddress,
        externalEvmAddress,
        connections,
        type,
        setFromAmount,
        setFromAddress,
        setToAddress,
        setFromChainId,
        setToChainId,
        chainId,
    ]);

    const handleAmountChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            if (!isEditable || !onAmountChange) return;
            const parsed = parseInputAmount(e.target.value);
            onAmountChange(parsed);
        },
        [isEditable, onAmountChange],
    );

    const handlePercentageClick = useCallback(
        (percentage: number) => {
            if (!balance || !onAmountChange || !token?.decimals) return;
            let effectiveBalance = balance;
            if (gasReserve !== null) {
                const afterGas = minus(balance, gasReserve);
                effectiveBalance = isLessThan(afterGas, 0) ? '0' : afterGas.toString();
            }
            const amount = multipliedBy(effectiveBalance, percentage / 100);
            const truncated = toFixed(amount, token.decimals);
            onAmountChange(truncated);
        },
        [balance, onAmountChange, token?.decimals, gasReserve],
    );

    const goToSelectToken = useGoToSelectToken({
        side: type,
        from: SwapFromPage.Swap,
    });

    const handleWalletClick = useCallback(() => {
        setWalletFilterOpen((prev) => !prev);
    }, []);

    const handleWalletSelect = useCallback(
        (address: string) => {
            if (type === 'pay') {
                setSelectedPayWallet(address);
            } else {
                setSelectedReceiveWallet(address);
            }
        },
        [type, setSelectedPayWallet, setSelectedReceiveWallet],
    );

    const handleWalletFilterClose = useCallback(() => {
        setWalletFilterOpen(false);
    }, []);

    const formattedBalance = useMemo(() => {
        if (!balance) return null;
        return formatTokenAmount(balance);
    }, [balance]);

    const formattedUsdValue = useMemo(() => {
        if (!usdValue) return null;
        return formatTokenUSD(usdValue, { minDisplay: 0.01 });
    }, [usdValue]);

    const isInsufficient = useMemo(() => {
        if (!isEditable || !fromAmount || Number.parseFloat(fromAmount) === 0) return false;
        const totalNeeded = gasReserve !== null ? plus(fromAmount, gasReserve) : fromAmount;
        return isGreaterThan(totalNeeded, balance || '0');
    }, [isEditable, fromAmount, balance, gasReserve]);

    const walletIcon = useMemo(() => {
        if (!walletAddress) return null;
        const appKitSolanaWallet = appKitSolanaWallets.find((w) => w.address === walletAddress);
        if (appKitSolanaWallet?.icon) return appKitSolanaWallet.icon;
        if (isExternalSolanaWallet) return walletConnectIcon;

        if (isSolanaChain(chainId)) {
            return null;
        }
        const evmWallet = connections.find((w) => w.accounts.some((acc) => isSameEthereumAddress(acc, walletAddress)));
        if (!evmWallet || evmWallet.connector.id === PRIVY_CONNECTOR_ID) return null;
        return evmWallet.connector.icon ?? null;
    }, [walletAddress, chainId, appKitSolanaWallets, isExternalSolanaWallet, connections]);

    const displayWalletIcon = useMemo(() => {
        if (!walletAddress) return null;
        if (isExternalEvmWallet) {
            return externalEvmIcon ?? walletIcon;
        }
        return walletIcon;
    }, [externalEvmIcon, isExternalEvmWallet, walletAddress, walletIcon]);

    return (
        <div className={cn('flex flex-col gap-2 rounded-2xl bg-lightBg px-3 pb-5 pt-3', className)}>
            <div className="relative flex items-center justify-between">
                <span className="text-[14px] font-medium leading-[14px] text-secondary">
                    {type === 'pay' ? <Trans>Pay</Trans> : <Trans>Receive</Trans>}
                </span>
                {hasWallet ? (
                    <button
                        type="button"
                        className="flex items-center gap-1 text-[14px] font-medium leading-[14px]"
                        onClick={handleWalletClick}
                    >
                        {displayWalletIcon ? (
                            <img src={displayWalletIcon} alt="" className="size-4 rounded-full" />
                        ) : (
                            <FireflyRoundIcon className="size-4" />
                        )}
                        <span className="text-main">
                            {walletNameMap.get(walletAddress?.toLowerCase() ?? '') ??
                                walletNameMap.get(walletAddress ?? '') ??
                                formatAddress(walletAddress, 4)}
                        </span>
                        <ArrowDownIcon className="size-3.5" />
                    </button>
                ) : (
                    <span className="flex items-center gap-1 text-[14px] font-medium leading-[14px] text-highlight">
                        <Trans>Connect Wallet</Trans>
                        <AddCircleLinearIcon className="size-3.5" />
                    </span>
                )}
                <WalletFilter
                    open={walletFilterOpen}
                    onClose={handleWalletFilterClose}
                    selectedAddress={walletAddress}
                    onSelect={handleWalletSelect}
                    chainId={chainId}
                    domainNameMap={walletNameMap}
                    accessPath={accessPath}
                    externalEvmAddress={externalEvmAddress}
                    externalEvmIcon={externalEvmIcon}
                    externalEvmName={externalEvmName}
                    externalSolanaAddress={externalSolanaAddress}
                />
            </div>

            <div className="flex h-12 items-center justify-between gap-2">
                <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={type === 'receive' && loading ? '-' : displayAmount || ''}
                    onChange={handleAmountChange}
                    autoFocus={autoFocus}
                    disabled={!isEditable}
                    className={cn(
                        'flex-1 border-0 bg-transparent p-0 text-[32px] font-semibold leading-[32px] shadow-none placeholder:text-third focus-visible:ring-0',
                        isInsufficient && 'text-[#ff3545]',
                    )}
                />

                <button
                    type="button"
                    className="flex shrink-0 items-center gap-2 rounded-[18px] bg-white py-1 pl-1 pr-2 dark:bg-white/10"
                    onClick={goToSelectToken}
                >
                    <TokenIcon
                        icon={token?.logoURI}
                        symbol={token?.symbol}
                        name={token?.name}
                        chainId={chainId ?? undefined}
                        size={28}
                        badgeSize={12}
                    />
                    <span className="text-[16px] font-semibold leading-4">{token?.symbol ?? t`Select`}</span>
                </button>
            </div>

            <div className="flex items-center justify-between">
                <span className="truncate text-[14px] font-medium leading-[14px] text-secondary">
                    {formattedUsdValue && !loading ? formattedUsdValue : '\u00A0'}
                </span>
                {token ? (
                    <span className="whitespace-nowrap text-[14px] font-medium leading-[14px] text-secondary">
                        {formattedBalance ?? '0'} {token.symbol}
                        {isEditable && formattedBalance ? (
                            <>
                                {' '}
                                <button
                                    type="button"
                                    className="font-medium text-highlight"
                                    onClick={() => handlePercentageClick(100)}
                                    disabled={isGasReserveLoading}
                                >
                                    <Trans>Max</Trans>
                                </button>
                            </>
                        ) : null}
                    </span>
                ) : null}
            </div>
        </div>
    );
});
