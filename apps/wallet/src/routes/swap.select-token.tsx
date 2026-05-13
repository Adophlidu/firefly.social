import GlobeIcon from '@dimensiondev/assets/global.svg';
import SearchIcon from '@dimensiondev/assets/search.svg';
import SelectedIcon from '@dimensiondev/assets/selected.svg';
import { isSolanaChain } from '@dimensiondev/web3/chains';
import { formatTokenAddress, isNativeTokenOrSameAddress } from '@dimensiondev/web3/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ChainIcon } from '@/components/ChainIcon.js';
import { NavigationBar } from '@/components/NavigationBar.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { SwapFromPage } from '@/constants/enum.js';
import { POLYMARKET_DEPOSIT_EVM_CHAIN_IDS } from '@/constants/ethereum.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { formatTokenAmount } from '@/helpers/swap/formatSwapAmount.js';
import { useTrendingTokensForWithdraw } from '@/hooks/bet/useTrendingTokensForWithdraw.js';
import { useEffectiveSwapWalletAddress } from '@/hooks/swap/useEffectiveSwapWalletAddress.js';
import { useGoBackAfterSelectToken } from '@/hooks/swap/useGoBackAfterSelectToken.js';
import { useSwapSupportedChains } from '@/hooks/swap/useSwapSupportedChains.js';
import { useSearchTokens, useSwapTokens } from '@/hooks/swap/useSwapTokens.js';
import type { SelectTokenSearch, SwapToken } from '@/providers/swap/types.js';
import { getPolymarketWithdrawSupportedTokensQueryOptions } from '@/queries/firefly/getPolymarketWithdrawSupportedTokensQueryOptions.js';
import {
    fromAddressAtom,
    fromAmountAtom,
    fromChainIdAtom,
    selectedPayWalletAtom,
    selectedReceiveWalletAtom,
    setFromTokenAtom,
    setToTokenAtom,
    toChainIdAtom,
} from '@/store/swap/swapState.js';

export const Route = createFileRoute('/swap/select-token')({
    component: SelectTokenPage,
});

function SelectTokenPage() {
    const { side, from } = useSearch({ from: '/swap/select-token' }) as Partial<SelectTokenSearch>;
    const goBack = useGoBackAfterSelectToken(from);
    const setFromAmount = useSetAtom(fromAmountAtom);
    const setFromToken = useSetAtom(setFromTokenAtom);
    const setToToken = useSetAtom(setToTokenAtom);

    const fromChainId = useAtomValue(fromChainIdAtom);
    const toChainId = useAtomValue(toChainIdAtom);
    const fromAddress = useAtomValue(fromAddressAtom);

    // Get selected wallet address setters
    const setSelectedPayWallet = useSetAtom(selectedPayWalletAtom);
    const setSelectedReceiveWallet = useSetAtom(selectedReceiveWalletAtom);

    // Get current side's chain ID to determine wallet address type
    const currentChainId = side === 'pay' ? fromChainId : side === 'receive' ? toChainId : null;

    const effectiveWalletAddress = useEffectiveSwapWalletAddress(side ?? 'pay', currentChainId);

    const [search, setSearch] = useState('');
    const [selectedChainId, setSelectedChainId] = useState<number | null>(null);
    const [showFolded, setShowFolded] = useState(false);
    const [showChainMenu, setShowChainMenu] = useState(false);
    const chainMenuRef = useRef<HTMLDivElement>(null);

    const isBetDeposit = from === SwapFromPage.BetDeposit;
    const isBetPage = isBetDeposit || from === SwapFromPage.BetWithdraw;

    const { data: trendingTokensForWithdraw } = useTrendingTokensForWithdraw({
        enabled: from === SwapFromPage.BetWithdraw,
        chainId: selectedChainId ?? undefined,
    });
    const { data: supportedChains, isLoading: isLoadingChains } = useSwapSupportedChains();
    const depositChainIds = useMemo(() => new Set([...POLYMARKET_DEPOSIT_EVM_CHAIN_IDS, 101]), []);
    const filteredSupportedChains = useMemo(
        () => (isBetPage ? supportedChains?.filter((c) => depositChainIds.has(c.chainId)) : supportedChains),
        [isBetPage, supportedChains, depositChainIds],
    );
    const {
        myTokens: rawMyTokens,
        recentTokens,
        trendingTokens: trendingTokensForSwap,
        isLoading,
    } = useSwapTokens({
        enabled: !isLoadingChains,
        chainId: selectedChainId ?? undefined,
        selectedWalletAddress: effectiveWalletAddress,
        currentChainId,
        hideTrending: isBetPage,
        hideRecent: isBetDeposit,
        supportedChains,
    });
    const { data: withdrawSupportedTokens } = useQuery({
        ...getPolymarketWithdrawSupportedTokensQueryOptions(),
        enabled: isBetPage,
    });

    const myTokens = useMemo(() => {
        if (!isBetPage || !withdrawSupportedTokens?.length) return rawMyTokens;

        const supportedSet = new Set(
            withdrawSupportedTokens.map((t) => `${t.chain_id}-${t.token_address.toLowerCase()}`),
        );
        return rawMyTokens.filter((token) => supportedSet.has(`${token.chainId}-${token.address.toLowerCase()}`));
    }, [isBetPage, withdrawSupportedTokens, rawMyTokens]);
    const trendingTokens = useMemo(
        () => (from === SwapFromPage.BetWithdraw ? trendingTokensForWithdraw : trendingTokensForSwap) || [],
        [trendingTokensForWithdraw, trendingTokensForSwap, from],
    );

    const { data: searchResults = [], isLoading: isSearching } = useSearchTokens(
        search,
        selectedChainId ? String(selectedChainId) : undefined,
    );

    const handleSelect = useCallback(
        (token: SwapToken) => {
            if (from && from !== SwapFromPage.Swap) {
                goBack({
                    address: token.address,
                    chainId: token.chainId,
                });
                return;
            }

            if (side === 'pay') {
                const currentIsSolana = isSolanaChain(fromChainId);
                const newIsSolana = isSolanaChain(token.chainId);
                const isTokenChanged = !isNativeTokenOrSameAddress(fromAddress ?? '', token.address);
                setFromToken({ address: token.address, chainId: token.chainId });
                if (isTokenChanged) {
                    setFromAmount('');
                }
                if (currentIsSolana !== newIsSolana) {
                    setSelectedPayWallet(null);
                }
            } else {
                const currentIsSolana = isSolanaChain(toChainId);
                const newIsSolana = isSolanaChain(token.chainId);
                setToToken({ address: token.address, chainId: token.chainId });
                if (currentIsSolana !== newIsSolana) {
                    setSelectedReceiveWallet(null);
                }
            }
            goBack();
        },
        [
            side,
            goBack,
            setFromToken,
            setToToken,
            setSelectedPayWallet,
            setSelectedReceiveWallet,
            setFromAmount,
            fromChainId,
            toChainId,
            fromAddress,
            from,
        ],
    );

    // Filter by search and selected chain
    const filterTokens = useCallback(
        (tokens: SwapToken[]) => {
            let filtered = tokens;
            if (selectedChainId !== null) {
                filtered = filtered.filter((t) => t.chainId === selectedChainId);
            }
            if (search) {
                const searchLower = search.toLowerCase();
                filtered = filtered.filter(
                    (token) =>
                        token.symbol.toLowerCase().includes(searchLower) ||
                        token.name.toLowerCase().includes(searchLower) ||
                        token.address.toLowerCase().includes(searchLower),
                );
            }
            return filtered;
        },
        [search, selectedChainId],
    );

    const filteredMyTokens = useMemo(() => filterTokens(myTokens), [filterTokens, myTokens]);
    const filteredRecentTokens = useMemo(() => filterTokens(recentTokens), [filterTokens, recentTokens]);
    const filteredTrendingTokens = useMemo(() => filterTokens(trendingTokens), [filterTokens, trendingTokens]);

    // Fold tokens with value < $1 or no value
    const [visibleMyTokens, foldedMyTokens] = useMemo(() => {
        const visible: SwapToken[] = [];
        const folded: SwapToken[] = [];
        for (const token of filteredMyTokens) {
            if (token.usdValue === undefined || token.usdValue < 1) {
                folded.push(token);
            } else {
                visible.push(token);
            }
        }

        return [visible, folded];
    }, [filteredMyTokens]);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Close chain menu on click outside
    useEffect(() => {
        if (!showChainMenu) return;

        function handleClickOutside(e: MouseEvent) {
            if (chainMenuRef.current && !chainMenuRef.current.contains(e.target as Node)) {
                setShowChainMenu(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showChainMenu]);
    // Scroll to selected chain button when selectedChainId changes
    useEffect(() => {
        if (!scrollRef.current) return;

        const button = scrollRef.current.querySelector(
            `button[data-chain-id="${selectedChainId || 'all'}"]`,
        ) as HTMLButtonElement | null;
        if (!button) return;

        button.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }, [selectedChainId]);

    const isSearchMode = search.length >= 2;
    const hasNoResults = isSearchMode
        ? !isSearching && searchResults.length === 0
        : !isLoading &&
          visibleMyTokens.length === 0 &&
          foldedMyTokens.length === 0 &&
          filteredRecentTokens.length === 0 &&
          filteredTrendingTokens.length === 0;

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden">
            <div className="bg-primaryBottom shrink-0">
                <NavigationBar onBack={() => goBack()}>
                    <Trans>Select Token</Trans>
                </NavigationBar>

                <div className="flex flex-col gap-2 px-3 pb-2">
                    <div className="bg-lightBg flex h-10 items-center gap-1 rounded-lg px-3">
                        <SearchIcon width={18} height={18} className="text-secondary shrink-0" />
                        <input
                            type="text"
                            placeholder={t`Search symbol or contract`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="text-main placeholder:text-secondary h-full flex-1 border-none bg-transparent text-[15px] outline-none focus:ring-0"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 py-1">
                        <div className="relative flex-1 overflow-hidden">
                            <div ref={scrollRef} className="no-scrollbar flex gap-2 overflow-x-auto">
                                <button
                                    type="button"
                                    data-chain-id="all"
                                    onClick={() => setSelectedChainId(null)}
                                    className={`font-inter shrink-0 rounded-[10px] px-2 py-1.5 text-[14px] font-semibold leading-[21px] ${
                                        selectedChainId === null ? 'bg-highlight text-white' : 'bg-lightBg text-main'
                                    }`}
                                >
                                    <Trans>All</Trans>
                                </button>
                                {filteredSupportedChains.map((chain) => (
                                    <button
                                        key={chain.chainId}
                                        type="button"
                                        data-chain-id={chain.chainId}
                                        onClick={() =>
                                            setSelectedChainId(selectedChainId === chain.chainId ? null : chain.chainId)
                                        }
                                        className={`font-inter shrink-0 rounded-[10px] px-2 py-1.5 text-[14px] font-semibold leading-[21px] ${
                                            selectedChainId === chain.chainId
                                                ? 'bg-highlight text-white'
                                                : 'bg-lightBg text-main'
                                        }`}
                                    >
                                        {chain.chainName}
                                    </button>
                                ))}
                            </div>
                            <div className="from-primaryBottom pointer-events-none absolute right-0 top-1/2 h-[33px] w-6 -translate-y-1/2 bg-gradient-to-l to-transparent" />
                        </div>
                        <div ref={chainMenuRef} className="relative shrink-0">
                            <button
                                type="button"
                                className="flex items-center justify-center py-1.5"
                                onClick={() => setShowChainMenu(!showChainMenu)}
                            >
                                <GlobeIcon className="text-main size-5" />
                            </button>
                            {showChainMenu ? (
                                <div className="no-scrollbar bg-primaryBottom absolute right-0 top-full z-20 mt-1 max-h-[70vh] min-w-[200px] overflow-y-auto rounded-xl shadow-[0_8px_64px_0_rgba(0,0,0,0.1)]">
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 px-4 py-[11px]"
                                        onClick={() => {
                                            setSelectedChainId(null);
                                            setShowChainMenu(false);
                                        }}
                                    >
                                        <GlobeIcon className="text-main size-6" />
                                        <span className="text-main text-sm font-semibold">
                                            <Trans>All networks</Trans>
                                        </span>
                                        {selectedChainId === null ? (
                                            <SelectedIcon className="text-main ml-auto size-6" />
                                        ) : null}
                                    </button>
                                    <div className="bg-line h-px" />
                                    {filteredSupportedChains.map((chain) => (
                                        <button
                                            key={chain.chainId}
                                            type="button"
                                            className="flex w-full items-center gap-2 px-4 py-[11px]"
                                            onClick={() => {
                                                setSelectedChainId(chain.chainId);
                                                setShowChainMenu(false);
                                            }}
                                        >
                                            <div className="border-line flex size-6 items-center justify-center overflow-hidden rounded-lg border">
                                                <ChainIcon
                                                    chainId={chain.chainId}
                                                    icon={chain.logoUrl}
                                                    className="rounded-none"
                                                />
                                            </div>
                                            <span className="text-main truncate text-sm font-semibold">
                                                {chain.chainName}
                                            </span>
                                            {selectedChainId === chain.chainId ? (
                                                <SelectedIcon className="text-main ml-auto size-6" />
                                            ) : null}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
                {(isSearchMode ? isSearching : isLoading || isLoadingChains) ? (
                    <LoadingSkeleton hideTrending={isBetDeposit} hideRecent={isBetDeposit} />
                ) : hasNoResults ? (
                    <NoResultsFallback
                        className="mt-8"
                        message={
                            search ? t`Oops! We couldn't find any tokens matching your search.` : t`No tokens available`
                        }
                    />
                ) : isSearchMode ? (
                    <div className="flex flex-col">
                        {searchResults.map((token) => (
                            <TrendingTokenItem
                                key={`search-${token.chainId}-${token.address}`}
                                token={token}
                                onClick={() => handleSelect(token)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {visibleMyTokens.length > 0 || foldedMyTokens.length > 0 ? (
                            <div className="flex flex-col">
                                {isBetDeposit && isBetDeposit ? null : (
                                    <div className="text-secondary px-3 text-[13px] font-medium leading-[17px]">
                                        <Trans>Your tokens</Trans>
                                    </div>
                                )}
                                {visibleMyTokens.map((token) => (
                                    <MyTokenItem
                                        key={`my-${token.chainId}-${token.address}`}
                                        token={token}
                                        onClick={() => handleSelect(token)}
                                    />
                                ))}
                                {foldedMyTokens.length > 0 ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowFolded(!showFolded)}
                                        className="bg-lightBg ml-4 flex items-center gap-1 self-start rounded-[10px] px-2 py-1.5"
                                    >
                                        <span className="text-secondary text-[13px] font-medium leading-[17px]">
                                            {showFolded ? t`Hide assets < 1 USD` : t`Show assets < 1 USD`}
                                        </span>
                                        {showFolded ? (
                                            <ChevronUp size={14} className="text-secondary" />
                                        ) : (
                                            <ChevronDown size={14} className="text-secondary" />
                                        )}
                                    </button>
                                ) : null}
                                {showFolded
                                    ? foldedMyTokens.map((token) => (
                                          <MyTokenItem
                                              key={`my-${token.chainId}-${token.address}`}
                                              token={token}
                                              onClick={() => handleSelect(token)}
                                          />
                                      ))
                                    : null}
                            </div>
                        ) : null}

                        {filteredRecentTokens.length > 0 ? (
                            <div className="flex flex-col">
                                <div className="text-secondary px-3 text-[13px] font-medium leading-[17px]">
                                    <Trans>Recent</Trans>
                                </div>
                                {filteredRecentTokens.map((token) => (
                                    <MyTokenItem
                                        key={`recent-${token.chainId}-${token.address}`}
                                        token={token}
                                        onClick={() => handleSelect(token)}
                                    />
                                ))}
                            </div>
                        ) : null}

                        {filteredTrendingTokens.length > 0 ? (
                            <div className="flex flex-col">
                                <div className="text-secondary px-3 text-[13px] font-medium leading-[17px]">
                                    <Trans>Trendings</Trans>
                                </div>
                                {filteredTrendingTokens.map((token) => (
                                    <TrendingTokenItem
                                        key={`trending-${token.chainId}-${token.address}`}
                                        token={token}
                                        onClick={() => handleSelect(token)}
                                    />
                                ))}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}

function SkeletonRow() {
    return (
        <div className="flex items-center gap-3 px-3 py-4">
            <div className="bg-lightBg size-9 shrink-0 rounded-[20px] dark:bg-white/10" />
            <div className="flex flex-1 items-start justify-between">
                <div className="flex flex-col gap-1">
                    <div className="bg-lightBg h-3 w-24 rounded-lg dark:bg-white/10" />
                    <div className="bg-lightBg h-3 w-12 rounded-lg dark:bg-white/10" />
                </div>
                <div className="bg-lightBg h-3 w-24 rounded-lg dark:bg-white/10" />
            </div>
        </div>
    );
}

interface LoadingSkeletonProps {
    hideTrending?: boolean;
    hideRecent?: boolean;
}

function LoadingSkeleton({ hideTrending, hideRecent }: LoadingSkeletonProps) {
    if (hideTrending && hideRecent) {
        return (
            <div className="w-full">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col">
                <div className="text-secondary px-3 text-[13px] font-medium leading-[17px]">
                    <Trans>Your tokens</Trans>
                </div>
                <SkeletonRow />
                <SkeletonRow />
            </div>
            {!hideTrending ? (
                <div className="flex flex-col">
                    <div className="text-secondary px-3 text-[13px] font-medium leading-[17px]">
                        <Trans>Trendings</Trans>
                    </div>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                </div>
            ) : null}
        </div>
    );
}

interface TokenItemProps {
    token: SwapToken;
    onClick: () => void;
}

interface TokenItemBaseProps {
    token: SwapToken;
    onClick?: () => void;
    subtitle: React.ReactNode;
    children?: React.ReactNode;
}

const TokenItemBase = memo(function TokenItemBase({ token, onClick, subtitle, children }: TokenItemBaseProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="hover:bg-lightBg flex w-full items-center gap-3 px-3 py-4 transition-colors"
        >
            <TokenIcon
                icon={token.logoURI}
                symbol={token.symbol}
                name={token.name}
                chainId={token.chainId}
                networkType={token.networkType}
                size={36}
                badgeSize={16}
                className="shrink-0 rounded-[18px]"
                badgeClassName="rounded-md border-[1.5px] border-white"
            />
            <div className="flex flex-1 flex-col items-start gap-1">
                <span className="text-main truncate text-sm font-semibold">{token.name}</span>
                <span className="text-secondary truncate text-[12px] font-medium leading-[14px]">{subtitle}</span>
            </div>
            {children}
        </button>
    );
});

const MyTokenItem = memo(function MyTokenItem({ token, onClick }: TokenItemProps) {
    const formattedBalance = token.balance ? formatTokenAmount(token.balance) : null;
    const formattedUsdValue = token.usdValue ? formatTokenUSD(token.usdValue, { minDisplay: 0.01 }) : null;
    const truncatedAddress = formatTokenAddress(token.address);

    const subtitle = formattedBalance
        ? `${formattedBalance} ${token.symbol}\u{FF5C}${truncatedAddress}`
        : truncatedAddress;

    return (
        <TokenItemBase token={token} onClick={onClick} subtitle={subtitle}>
            {formattedUsdValue ? (
                <span className="text-main shrink-0 text-right text-[14px] font-semibold leading-[14px]">
                    {formattedUsdValue}
                </span>
            ) : null}
        </TokenItemBase>
    );
});

const TrendingTokenItem = memo(function TrendingTokenItem({ token, onClick }: TokenItemProps) {
    const truncatedAddress = formatTokenAddress(token.address);
    const marketCap = token.marketCapUsd ? formatMarketCap(parseFloat(token.marketCapUsd)) : null;
    const priceChange = token.priceChange24h
        ? `${parseFloat(token.priceChange24h) >= 0 ? '+' : ''}${parseFloat(token.priceChange24h).toFixed(2)}%`
        : null;
    const isPriceDown = token.priceChange24h ? Number.parseFloat(token.priceChange24h) < 0 : false;

    const subtitle = `${token.symbol}\u{FF5C}${truncatedAddress}`;

    return (
        <TokenItemBase token={token} onClick={onClick} subtitle={subtitle}>
            {marketCap || priceChange ? (
                <div className="flex shrink-0 flex-col items-end gap-1">
                    {marketCap ? (
                        <span className="text-main text-right text-[14px] font-semibold leading-[14px]">
                            {marketCap}
                        </span>
                    ) : null}
                    {priceChange ? (
                        <span
                            className={`text-right text-[12px] font-medium leading-[12px] ${isPriceDown ? 'text-[#ff3545]' : 'text-[#3dc233]'}`}
                        >
                            {priceChange}
                        </span>
                    ) : null}
                </div>
            ) : null}
        </TokenItemBase>
    );
});

function formatMarketCap(value: number): string {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return formatTokenUSD(value, { minDisplay: 0.01 });
}
