import betImageFallback from '@dimensiondev/assets/bet-image-fallback.svg?url';
import ClaimProceedsCloseIcon from '@dimensiondev/assets/claim-proceeds-close.svg';
import ClaimProceedsSuccessIcon from '@dimensiondev/assets/claim-proceeds-success.svg';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { waitForEthereumTransaction } from '@dimensiondev/web3/actions';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Address, Hash } from 'viem';
import { polygon } from 'viem/chains';
import { useConfig } from 'wagmi';
import { signMessage } from 'wagmi/actions';

import {
    DialogOrDrawer,
    DialogOrDrawerClose,
    DialogOrDrawerContent,
    DialogOrDrawerTrigger,
} from '@/components/DialogOrDrawer.js';
import { Image } from '@/components/Image.js';
import { Button } from '@/components/ui/button.js';
import { formatPercentRateMin } from '@/helpers/formatPercentRate.js';
import { formatPnlUSD } from '@/helpers/formatPnlUSD.js';
import { computeClaimAmount } from '@/helpers/polymarketClaim.js';
import { getPositionsQueryKeys } from '@/helpers/polymarketPositionsCache.js';
import { cn } from '@/lib/utils.js';
import { getPolymarketClaimableProceedsQueryOptions } from '@/queries/firefly/getPolymarketClaimableProceedsQueryOptions.js';
import { getPolymarketWithdrawableAmountQueryOptions } from '@/queries/firefly/getPolymarketWithdrawableAmountQueryOptions.js';
import { getPolymarketUserValueQueryOptions } from '@/queries/polymarket/getPolymarketUserValueQueryOptions.js';
import { showEmbeddedWalletUIAtom } from '@/store/embeddedWallets.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';
import { store } from '@/store/index.js';

const POLYMARKET_CLAIM_ORIGINAL_MESSAGE = 'polymarket claim proceed';

export function ClaimProceedsSection({ proxyAddress }: { proxyAddress: Address }) {
    const config = useConfig();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const { data } = useSuspenseQuery(getPolymarketClaimableProceedsQueryOptions(proxyAddress));

    const totalWon = data.totalWon;
    const items = data.items;
    const shouldRender = items.length > 0 && Number.isFinite(totalWon) && totalWon > 0;

    const topIcons = items.slice(0, 3);
    const totalWonText = formatPnlUSD(totalWon);
    const claimItems = useMemo(() => {
        return items
            .filter((x) => Boolean(x.conditionId))
            .map((x) => ({
                condition_id: x.conditionId,
                negative_risk: Boolean(x.negRisk),
                ...(computeClaimAmount(x) ? { amount: computeClaimAmount(x) } : {}),
            }));
    }, [items]);

    const { mutate, isPending } = useMutation({
        mutationKey: ['polymarket-claim-proceeds', proxyAddress],
        async mutationFn() {
            store.set(showEmbeddedWalletUIAtom, false);
            const signature = await signMessage(config, { message: POLYMARKET_CLAIM_ORIGINAL_MESSAGE });
            const data = await getFireflyEndpoint().polymarketBatchClaimV2({
                items: claimItems,
                original_message: POLYMARKET_CLAIM_ORIGINAL_MESSAGE,
                signature_message: signature,
            });
            await waitForEthereumTransaction(config, polygon.id, data.hash as Hash);
            return data;
        },
        async onSuccess() {
            toast.success(<Trans>Claim requested</Trans>);
            setOpen(false);
            // Optimistically hide ClaimProceedsSection immediately by clearing cached data.
            const proxy = proxyAddress.toLowerCase();
            const positionsQueryKeys = getPositionsQueryKeys(proxyAddress);
            queryClient.setQueryData(['polymarket-claimable-proceeds', proxy], []);

            // Force refresh immediately (don't wait for focus/interval).
            await Promise.all([
                queryClient.refetchQueries({ queryKey: positionsQueryKeys.current, exact: true, type: 'all' }),
                queryClient.refetchQueries({ queryKey: positionsQueryKeys.closed, exact: true, type: 'all' }),
                queryClient.refetchQueries({
                    queryKey: getPolymarketWithdrawableAmountQueryOptions(proxyAddress).queryKey,
                    exact: true,
                    type: 'all',
                }),
                queryClient.refetchQueries({
                    queryKey: getPolymarketUserValueQueryOptions(proxyAddress).queryKey,
                    exact: true,
                    type: 'all',
                }),
            ]);

            // Notify parent page to refetch
            iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_NOTIFY, {
                type: 'position-operation',
                data: { action: 'claim-proceeds', address: proxyAddress },
            });
        },
        onError(error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error(<Trans>Failed to claim winnings</Trans>, { description: message });
        },
        onSettled() {
            store.set(showEmbeddedWalletUIAtom, true);
        },
    });

    if (!shouldRender) return null;

    return (
        <DialogOrDrawer open={open} onOpenChange={setOpen}>
            <DialogOrDrawerTrigger asChild>
                <button
                    type="button"
                    className="border-line col-span-2 flex w-full items-center justify-between gap-3 rounded-xl border p-4"
                >
                    <span className="flex flex-col items-start justify-center gap-0.5 text-left">
                        <span className="text-success text-sm font-semibold leading-5">{totalWonText}</span>
                        <span className="text-second text-xs leading-[14px]">
                            <Trans>Claim winnings</Trans>
                        </span>
                    </span>
                    <span className="flex items-center gap-3">
                        <span className="-space-x-4">
                            {topIcons.map((x, idx) => (
                                <span
                                    key={`${x.conditionId}-${idx}`}
                                    className="border-lightBottom bg-lightBg inline-block size-10 overflow-hidden rounded-lg border-2 shadow-sm"
                                >
                                    <Image
                                        src={x.image}
                                        alt=""
                                        width={40}
                                        height={40}
                                        fallback={betImageFallback}
                                        className="size-full object-cover"
                                    />
                                </span>
                            ))}
                        </span>
                    </span>
                </button>
            </DialogOrDrawerTrigger>

            <DialogOrDrawerContent className="w-full gap-6 rounded-t-2xl pt-6">
                <div className="mb-6 flex w-full items-center justify-between">
                    <div className="text-main flex-1 text-lg font-bold leading-[22px]">
                        <Trans>Claim winnings</Trans>
                    </div>
                    <DialogOrDrawerClose asChild>
                        <button type="button" className="text-second shrink-0">
                            <ClaimProceedsCloseIcon width={24} height={24} />
                        </button>
                    </DialogOrDrawerClose>
                </div>

                <div className="flex w-full flex-col items-center gap-4 px-2">
                    <ClaimProceedsSuccessIcon width={64} height={64} />
                    <div className="flex flex-col items-center">
                        <div className="text-main text-center text-base font-semibold leading-6">
                            <Trans>You won</Trans>
                        </div>
                        <div className="text-success w-full text-center text-lg font-bold leading-6">
                            {formatPnlUSD(totalWon)}
                        </div>
                    </div>
                    <div className="text-second text-center text-sm font-medium leading-[18px]">
                        <Trans>Great job predicting the future!</Trans>
                    </div>
                </div>

                <div className="my-6 max-h-[194px] w-full space-y-4 overflow-y-auto px-2">
                    {items.map((x) => {
                        const betUsd = BigNumber(x.shares ?? 0).times(x.avg_price ?? 0);
                        const betText = formatPnlUSD(betUsd.toString());
                        const wonText = formatPnlUSD(x.won ?? 0);

                        const pctTextRaw = formatPercentRateMin(x.pnl_rate ?? 0, { decimals: 2, minPercent: 0.01 });
                        const pctText =
                            (x.pnl_rate ?? 0) > 0 && !pctTextRaw.startsWith('+') && !pctTextRaw.startsWith('-')
                                ? `+${pctTextRaw}`
                                : pctTextRaw;

                        return (
                            <div key={x.conditionId} className="flex w-full items-center gap-2">
                                <div className="bg-lightBg size-10 overflow-hidden rounded-lg">
                                    <Image
                                        src={x.image}
                                        alt={x.conditionId}
                                        width={40}
                                        height={40}
                                        fallback={betImageFallback}
                                        className="size-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-1 flex-col justify-center">
                                    <div className="text-second line-clamp-1 text-sm font-semibold leading-5">
                                        {x.title}
                                    </div>
                                    <div className="text-main text-base font-semibold leading-6">
                                        <Trans>
                                            {betText} • Won{' '}
                                            <span className={cn(x.isWin ? 'text-success' : 'text-danger')}>
                                                {wonText}({pctText})
                                            </span>
                                        </Trans>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="w-full">
                    <Button
                        type="button"
                        size="lg"
                        variant="primary"
                        className="h-10 w-full rounded-full font-bold"
                        loading={isPending}
                        disabled={!claimItems.length}
                        onClick={() => mutate()}
                    >
                        <Trans>Claim winnings</Trans>
                    </Button>
                </div>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
}
