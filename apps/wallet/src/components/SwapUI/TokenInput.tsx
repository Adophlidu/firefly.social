import AddCircleLinearIcon from '@dimensiondev/assets/add-circle-linear.svg';
import ArrowDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import FireflyRoundIcon from '@dimensiondev/assets/firefly.round.svg';
import { isSolanaChain } from '@dimensiondev/web3/chains';
import { isGreaterThan, multipliedBy, toFixed } from '@dimensiondev/web3/numbers';
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
import { SwapFromPage } from '@/constants/enum.js';
import { PRIVY_CONNECTOR_ID } from '@/constants/static.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { formatTokenAmount, parseInputAmount } from '@/helpers/swap/formatSwapAmount.js';
import { useEffectiveSwapWalletAddress } from '@/hooks/swap/useEffectiveSwapWalletAddress.js';
import { useGoToSelectToken } from '@/hooks/swap/useGoToSelectToken.js';
import { useSwapQuote } from '@/hooks/swap/useSwapQuote.js';
import { useSwapContextWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { useWalletDomainNames } from '@/hooks/useWalletDomainNames.js';
import { cn } from '@/lib/utils.js';
import { getDefaultSwapToken } from '@/providers/swap/defaultTokens.js';
import type { SwapToken } from '@/providers/swap/types.js';
import {
    accessPathAtom,
    externalEvmAddressAtom,
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
    onAmountChange,
    autoFocus,
    className,
}: TokenInputProps) {
    const fromAmount = useAtomValue(fromAmountAtom);
    const { quote } = useSwapQuote();
    const toAmount = quote?.toAmount || '';

    const accessPath = useAtomValue(accessPathAtom);
    const externalEvmAddress = useAtomValue(externalEvmAddressAtom);
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
    const connections = useConnections();

    const displayAmount = type === 'pay' ? fromAmount : toAmount;
    const isEditable = type === 'pay';

    // Track previous wallet type for reset logic
    const prevWalletTypeRef = useRef<'evm' | 'solana' | null>(null);

    const walletAddress = useEffectiveSwapWalletAddress(type, chainId);

    const hasWallet = isPrivyReady && !!walletAddress;

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
            if (!balance || !onAmountChange || !token) return;
            const amount = multipliedBy(balance, percentage / 100);
            const truncated = toFixed(amount, token.decimals);
            onAmountChange(truncated);
        },
        [balance, onAmountChange, token],
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
        if (!isEditable || !fromAmount) return false;
        return isGreaterThan(fromAmount, balance || '0');
    }, [isEditable, fromAmount, balance]);

    const walletIcon = useMemo(() => {
        if (!walletAddress) return null;
        if (isSolanaChain(chainId)) return null; // Solana wallets are always embedded
        const evmWallet = connections.find((w) => w.accounts.some((acc) => isSameEthereumAddress(acc, walletAddress)));
        if (!evmWallet || evmWallet.connector.id === PRIVY_CONNECTOR_ID) return null;
        return evmWallet.connector.icon ?? null;
    }, [walletAddress, chainId, connections]);

    return (
        <div className={cn('bg-lightBg flex flex-col gap-2 rounded-2xl px-3 pb-5 pt-3', className)}>
            <div className="relative flex items-center justify-between">
                <span className="text-secondary text-[14px] font-medium leading-[14px]">
                    {type === 'pay' ? <Trans>Pay</Trans> : <Trans>Receive</Trans>}
                </span>
                {hasWallet ? (
                    <button
                        type="button"
                        className="flex items-center gap-1 text-[14px] font-medium leading-[14px]"
                        onClick={handleWalletClick}
                    >
                        {walletIcon ? (
                            <img src={walletIcon} alt="" className="size-4 rounded-full" />
                        ) : (
                            <FireflyRoundIcon className="size-4" />
                        )}
                        <span className="text-main">
                            {domainNameMap.get(walletAddress?.toLowerCase() ?? '') ??
                                domainNameMap.get(walletAddress ?? '') ??
                                formatAddress(walletAddress, 4)}
                        </span>
                        <ArrowDownIcon className="size-3.5" />
                    </button>
                ) : (
                    <span className="text-highlight flex items-center gap-1 text-[14px] font-medium leading-[14px]">
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
                    domainNameMap={domainNameMap}
                    accessPath={accessPath}
                    externalEvmAddress={externalEvmAddress}
                    externalSolanaAddress={externalSolanaAddress}
                />
            </div>

            <div className="flex h-12 items-center justify-between gap-2">
                <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={!isEditable && loading ? '-' : displayAmount || ''}
                    onChange={handleAmountChange}
                    autoFocus={autoFocus}
                    disabled={!isEditable}
                    className={cn(
                        'placeholder:text-third flex-1 border-0 bg-transparent p-0 text-[32px] font-semibold leading-[32px] shadow-none focus-visible:ring-0',
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
                <span className="text-secondary truncate text-[14px] font-medium leading-[14px]">
                    {formattedUsdValue && !loading ? formattedUsdValue : '\u00A0'}
                </span>
                {token ? (
                    <span className="text-secondary whitespace-nowrap text-[14px] font-medium leading-[14px]">
                        {formattedBalance ?? '0'} {token.symbol}
                        {isEditable && formattedBalance ? (
                            <>
                                {' '}
                                <button
                                    type="button"
                                    className="text-highlight font-medium"
                                    onClick={() => handlePercentageClick(100)}
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
