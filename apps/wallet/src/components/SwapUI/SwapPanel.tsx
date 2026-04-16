import ArrowSwapHorizontalIcon from '@dimensiondev/assets/arrow-swap-horizontal.svg';
import InfoCircleBoldIcon from '@dimensiondev/assets/info-circle-bold.svg';
import SwapFlipIcon from '@dimensiondev/assets/swap-flip.svg';
import SwapLoadingIcon from '@dimensiondev/assets/swap-loading.svg';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { compact, uniq } from 'lodash-es';
import { memo, useCallback, useMemo, useState } from 'react';

import { SwapActionButton } from '@/components/SwapUI/SwapActionButton.js';
import { SwapReview } from '@/components/SwapUI/SwapReview.js';
import { TokenInput } from '@/components/SwapUI/TokenInput.js';
import { toFixed } from '@/helpers/number.js';
import { formatRate } from '@/helpers/swap/formatSwapAmount.js';
import { useEffectiveSwapWalletAddress } from '@/hooks/swap/useEffectiveSwapWalletAddress.js';
import { useResolvedSwapTokens } from '@/hooks/swap/useResolvedSwapTokens.js';
import { useSwapExecute } from '@/hooks/swap/useSwapExecute.js';
import { useSwapQuote } from '@/hooks/swap/useSwapQuote.js';
import { useSwapContextWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { createSwapEndpoint } from '@/providers/swap/swapEndpoint.js';
import { fireflySessionTokenAtom } from '@/store/fireflySession.js';
import { skipReviewAtom } from '@/store/swap/swapSettings.js';
import { fromAmountAtom, swapTokensAtom } from '@/store/swap/swapState.js';

export interface SwapPanelProps {
    className?: string;
}

export const SwapPanel = memo(function SwapPanel({ className }: SwapPanelProps) {
    const [showReview, setShowReview] = useState(false);
    const [rateReversed, setRateReversed] = useState(false);

    const { fromToken, toToken, resolvedFromChain, resolvedToChain } = useResolvedSwapTokens();
    const skipReview = useAtomValue(skipReviewAtom);

    const [fromAmount, setFromAmount] = useAtom(fromAmountAtom);
    const swapTokens = useSetAtom(swapTokensAtom);

    const { quote, rate, isLoading: quoteLoading, isFetching: quoteFetching } = useSwapQuote();
    const toAmount = quote?.toAmount || '';

    const { loading: executionLoading, execute } = useSwapExecute();

    const { isPrivyReady } = useSwapContextWalletAddresses();
    const authToken = useAtomValue(fireflySessionTokenAtom);
    const payAddress = useEffectiveSwapWalletAddress('pay', resolvedFromChain);
    const receiveAddress = useEffectiveSwapWalletAddress('receive', resolvedToChain);

    // Collect unique chain IDs from selected tokens
    const balanceChainIds = useMemo(
        () => uniq([resolvedFromChain, resolvedToChain]),
        [resolvedFromChain, resolvedToChain],
    );

    // Collect unique wallet addresses for balance query
    const balanceAddresses = useMemo(() => uniq(compact([payAddress, receiveAddress])), [payAddress, receiveAddress]);

    const { data: balancesByWallet, isLoading: isBalanceLoading } = useQuery({
        queryKey: ['swap-panel-balances', balanceAddresses, balanceChainIds, authToken],
        queryFn: async () => {
            const endpoint = createSwapEndpoint(authToken ?? undefined);
            return endpoint.getUserTokenBalancesMultiChain(balanceAddresses, balanceChainIds);
        },
        enabled: isPrivyReady && balanceAddresses.length > 0 && balanceChainIds.length > 0,
        staleTime: 30 * 1000,
    });

    // Derive balances from the wallet-grouped query data
    const fromBalance = useMemo(() => {
        if (!balancesByWallet || !fromToken || !payAddress) return undefined;
        const tokens = balancesByWallet.get(payAddress.toLowerCase());
        const match = tokens?.find(
            (t) => t.chainId === fromToken.chainId && t.address.toLowerCase() === fromToken.address.toLowerCase(),
        );
        return match?.balance;
    }, [balancesByWallet, fromToken, payAddress]);

    const toBalance = useMemo(() => {
        if (!balancesByWallet || !toToken || !receiveAddress) return undefined;
        const tokens = balancesByWallet.get(receiveAddress.toLowerCase());
        const match = tokens?.find(
            (t) => t.chainId === toToken.chainId && t.address.toLowerCase() === toToken.address.toLowerCase(),
        );
        return match?.balance;
    }, [balancesByWallet, toToken, receiveAddress]);

    const handleAction = useCallback(async () => {
        if (skipReview) {
            await execute();
        } else {
            setShowReview(true);
        }
    }, [skipReview, execute]);

    const handleConfirm = useCallback(async () => {
        setShowReview(false);
        await execute();
    }, [execute]);

    const handlePercentageClick = useCallback(
        (percentage: number) => {
            if (!fromBalance) return;
            const balanceNum = parseFloat(fromBalance);
            if (isNaN(balanceNum)) return;
            const amount = (balanceNum * percentage) / 100;
            setFromAmount(toFixed(amount, 6));
        },
        [fromBalance, setFromAmount],
    );

    const isLoading = quoteLoading || executionLoading;

    const hasRiskToken = fromToken?.isRiskToken || toToken?.isRiskToken;
    const riskTokenSymbol = fromToken?.isRiskToken ? fromToken.symbol : toToken?.isRiskToken ? toToken.symbol : null;

    const formattedRate =
        fromToken && toToken && rate
            ? rateReversed
                ? formatRate(toToken.symbol, fromToken.symbol, 1 / rate)
                : formatRate(fromToken.symbol, toToken.symbol, rate)
            : null;

    return (
        <div className={`flex flex-1 flex-col gap-3 ${className ?? ''}`}>
            {hasRiskToken && riskTokenSymbol ? (
                <div className="flex h-7 items-center gap-1 rounded-xl bg-[rgba(238,131,4,0.1)] px-2 py-1">
                    <InfoCircleBoldIcon className="size-4 shrink-0 text-[#FFB100]" />
                    <span className="text-[13px] font-medium leading-[18px] text-[#FFB100]">
                        <Trans>{riskTokenSymbol} is a high-risk token</Trans>
                    </span>
                </div>
            ) : null}

            <div className="relative flex flex-col gap-1">
                <TokenInput
                    type="pay"
                    token={fromToken}
                    chainId={resolvedFromChain}
                    balance={fromBalance}
                    usdValue={fromAmount ? (fromToken?.price ?? 0) * parseFloat(fromAmount) : undefined}
                    loading={isLoading}
                    onAmountChange={setFromAmount}
                    autoFocus
                />

                <div className="relative">
                    <TokenInput
                        type="receive"
                        token={toToken}
                        chainId={resolvedToChain}
                        balance={toBalance}
                        usdValue={toAmount ? (toToken?.price ?? 0) * parseFloat(toAmount) : undefined}
                        loading={quoteLoading}
                    />

                    <div className="dark:border-darkBottom absolute left-1/2 top-0 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border-4 border-white bg-[#ebecff]">
                        {quoteLoading ? (
                            <SwapLoadingIcon className="text-highlight size-6 animate-spin" />
                        ) : (
                            <button
                                type="button"
                                className="flex size-8 items-center justify-center"
                                onClick={() => swapTokens()}
                                disabled={isLoading}
                            >
                                <SwapFlipIcon className="text-highlight size-6 -rotate-90" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {formattedRate ? (
                <div className="flex items-center justify-between px-3 text-[14px]">
                    <span className="text-secondary font-normal leading-[14px]">
                        <Trans>Rate</Trans>
                    </span>
                    <span
                        className="text-main flex cursor-pointer items-center gap-1 font-medium leading-[18px]"
                        onClick={() => setRateReversed((v) => !v)}
                    >
                        {quoteLoading ? '-' : formattedRate}
                        <ArrowSwapHorizontalIcon className="size-3.5" />
                    </span>
                </div>
            ) : null}

            <div className="mt-auto flex items-center justify-between">
                {[
                    { label: '25%', value: 25 },
                    { label: '50%', value: 50 },
                    { label: '75%', value: 75 },
                    { label: <Trans>Max</Trans>, value: 100 },
                ].map(({ label, value }) => (
                    <button
                        key={value}
                        type="button"
                        className="bg-lightBg w-[70px] rounded-2xl px-4 py-1 text-center text-[16px] font-semibold leading-6"
                        onClick={() => handlePercentageClick(value)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <SwapActionButton
                onClick={handleAction}
                loading={isLoading}
                fromBalance={fromBalance}
                isBalanceLoading={isBalanceLoading}
            />

            <SwapReview
                open={showReview}
                onConfirm={handleConfirm}
                onOpenChange={setShowReview}
                loading={isLoading}
                fetching={quoteFetching}
            />
        </div>
    );
});
