import ArrowSwapHorizontalIcon from '@dimensiondev/assets/arrow-swap-horizontal.svg';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useAtomValue } from 'jotai';
import { memo } from 'react';

import {
    DialogOrDrawer,
    DialogOrDrawerContent,
    DialogOrDrawerHeader,
    DialogOrDrawerTitle,
} from '@/components/DialogOrDrawer.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { formatGasEstimate, formatTokenAmount } from '@/helpers/swap/formatSwapAmount.js';
import { useEffectiveSwapWalletAddress } from '@/hooks/swap/useEffectiveSwapWalletAddress.js';
import { useResolvedSwapTokens } from '@/hooks/swap/useResolvedSwapTokens.js';
import { useSwapQuote } from '@/hooks/swap/useSwapQuote.js';
import { getSlippagePercent, slippageAtom } from '@/store/swap/swapSettings.js';
import { fromAmountAtom } from '@/store/swap/swapState.js';

export interface SwapReviewProps {
    open: boolean;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
    loading?: boolean;
    fetching?: boolean;
}

export const SwapReview = memo(function SwapReview({
    open,
    onConfirm,
    onOpenChange,
    loading = false,
    fetching = false,
}: SwapReviewProps) {
    const { fromToken, toToken, resolvedFromChain: fromChainId, resolvedToChain: toChainId } = useResolvedSwapTokens();
    const fromAmount = useAtomValue(fromAmountAtom);
    const { quote } = useSwapQuote();
    const toAmount = quote?.toAmount || '';
    const slippage = useAtomValue(slippageAtom);

    const payWallet = useEffectiveSwapWalletAddress('pay', fromChainId);
    const receiveWallet = useEffectiveSwapWalletAddress('receive', toChainId ?? fromChainId);

    const slippagePercent = getSlippagePercent(slippage);

    const fromUsdValue = fromToken && fromAmount ? (fromToken.price ?? 0) * parseFloat(fromAmount) : 0;

    const toUsdValue = toToken && toAmount ? (toToken.price ?? 0) * parseFloat(toAmount) : 0;

    const rate =
        fromToken && toToken && fromAmount && toAmount && parseFloat(fromAmount) > 0
            ? parseFloat(toAmount) / parseFloat(fromAmount)
            : 0;

    const gasUsd = quote && 'gasUsd' in quote ? quote.gasUsd : undefined;
    const minReceived = quote?.minReceived;

    return (
        <DialogOrDrawer open={open} onOpenChange={onOpenChange}>
            <DialogOrDrawerContent className="max-h-screen overflow-y-auto">
                <DialogOrDrawerHeader className="shrink-0 !flex-row pb-2">
                    <DialogOrDrawerTitle className="flex justify-start">
                        <Trans>Review</Trans>
                    </DialogOrDrawerTitle>
                </DialogOrDrawerHeader>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between gap-2 py-2">
                            <div className="flex items-center gap-3">
                                <TokenIcon
                                    size={32}
                                    badgeSize={16}
                                    icon={fromToken?.logoURI}
                                    chainId={fromChainId ?? undefined}
                                    symbol={fromToken?.symbol}
                                    name={fromToken?.name}
                                    roundedSquareBadge
                                />
                                <span className="text-[20px] font-semibold">{fromToken?.symbol}</span>
                            </div>
                            <div className="flex min-w-0 grow flex-col items-end">
                                <span className="max-w-full truncate text-[20px] font-semibold">-{fromAmount}</span>
                                <span className="text-secondary text-[11px]">
                                    {formatTokenUSD(fromUsdValue, { minDisplay: 0.01 })}
                                </span>
                            </div>
                        </div>

                        <div className="bg-line h-px" />

                        <div className="flex items-center justify-between gap-2 py-2">
                            <div className="flex items-center gap-3">
                                <TokenIcon
                                    size={32}
                                    badgeSize={16}
                                    icon={toToken?.logoURI}
                                    chainId={toChainId ?? fromChainId ?? undefined}
                                    symbol={toToken?.symbol}
                                    name={toToken?.name}
                                    roundedSquareBadge
                                />
                                <span className="text-[20px] font-semibold">{toToken?.symbol}</span>
                            </div>
                            <div className="flex min-w-0 grow flex-col items-end">
                                <span
                                    className="max-w-full truncate text-[20px] font-semibold text-[#429f37]"
                                    title={`+${toAmount}`}
                                >
                                    +{toAmount}
                                </span>
                                <span className="text-secondary text-[11px]">
                                    ≈{formatTokenUSD(toUsdValue, { minDisplay: 0.01 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col rounded-2xl border border-[rgba(34,33,47,0.15)]">
                        <div className="flex flex-col gap-3 p-3">
                            {payWallet ? (
                                <div className="flex items-center justify-between text-[13px]">
                                    <span className="text-secondary">
                                        <Trans>Pay Wallet</Trans>
                                    </span>
                                    <span className="font-medium">{formatAddress(payWallet, 4)}</span>
                                </div>
                            ) : null}

                            {receiveWallet ? (
                                <div className="flex items-center justify-between text-[13px]">
                                    <span className="text-secondary">
                                        <Trans>Receive Wallet</Trans>
                                    </span>
                                    <span className="font-medium">{formatAddress(receiveWallet, 4)}</span>
                                </div>
                            ) : null}

                            {fromToken && toToken && rate > 0 ? (
                                <div className="flex items-center justify-between text-[13px]">
                                    <span className="text-secondary">
                                        <Trans>Rate</Trans>
                                    </span>
                                    <span className="flex items-center gap-1 font-medium">
                                        1 {fromToken.symbol} ≈ {rate >= 1 ? rate.toFixed(2) : rate.toFixed(6)}{' '}
                                        {toToken.symbol}
                                        <ArrowSwapHorizontalIcon className="text-main size-3" />
                                    </span>
                                </div>
                            ) : null}

                            <div className="flex items-center justify-between text-[13px]">
                                <span className="text-secondary">
                                    <Trans>Network Fee</Trans>
                                </span>
                                <span className="font-medium">{formatGasEstimate(gasUsd)}</span>
                            </div>

                            <div className="flex items-center justify-between text-[13px]">
                                <span className="text-secondary">
                                    <Trans>Slippage</Trans>
                                </span>
                                <span className="flex items-center gap-1 font-medium">
                                    {slippage === 'auto' ? t`Auto` : `${slippagePercent}%`}
                                    <ArrowSwapHorizontalIcon className="text-main size-3" />
                                </span>
                            </div>
                        </div>

                        {minReceived && toToken ? (
                            <>
                                <div className="bg-line h-px" />
                                <div className="flex items-center justify-between p-3 text-[13px]">
                                    <span className="text-secondary">
                                        <Trans>Receive at least</Trans>
                                    </span>
                                    <div className="flex flex-col items-end">
                                        <span className="font-medium">
                                            {formatTokenAmount(minReceived)} {toToken.symbol}
                                        </span>
                                        {toToken.price ? (
                                            <span className="text-secondary text-[11px]">
                                                ≈
                                                {formatTokenUSD(parseFloat(minReceived) * toToken.price, {
                                                    minDisplay: 0.01,
                                                })}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>

                    <button
                        type="button"
                        className="bg-main h-10 w-full rounded-full text-[15px] font-bold text-white disabled:opacity-50 dark:text-black"
                        onClick={onConfirm}
                        disabled={loading || fetching}
                    >
                        {loading ? t`Confirming...` : t`Confirm`}
                    </button>
                </div>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
});
