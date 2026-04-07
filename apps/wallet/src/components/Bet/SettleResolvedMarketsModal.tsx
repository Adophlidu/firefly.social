import betImageFallback from '@dimensiondev/assets/bet-image-fallback.svg?url';
import ClaimProceedsSuccessIcon from '@dimensiondev/assets/claim-proceeds-success.svg';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { type Address, type Hash } from 'viem';
import { polygon } from 'viem/chains';
import { useConfig } from 'wagmi';
import { signMessage, waitForTransactionReceipt } from 'wagmi/actions';

import { DialogOrDrawerContent, DialogOrDrawerHeader, DialogOrDrawerTitle } from '@/components/DialogOrDrawer.js';
import { Image } from '@/components/Image.js';
import { Button } from '@/components/ui/button.js';
import { formatPercentRateMin } from '@/helpers/formatPercentRate.js';
import { formatPnlUSD } from '@/helpers/formatPnlUSD.js';
import { computeClaimAmount } from '@/helpers/polymarketClaim.js';
import { type PolymarketClaimV2Item, type PolymarketPosition } from '@/providers/types/Firefly.js';
import { getPolymarketWithdrawableAmountQueryOptions } from '@/queries/firefly/getPolymarketWithdrawableAmountQueryOptions.js';
import { getPolymarketUserValueQueryOptions } from '@/queries/polymarket/getPolymarketUserValueQueryOptions.js';
import { showEmbeddedWalletUIAtom } from '@/store/embeddedWallets.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';
import { store } from '@/store/index.js';

const POLYMARKET_CLAIM_ORIGINAL_MESSAGE = 'polymarket claim proceed';
const EMPTY_SETTLABLE_POSITIONS = {
    winningItems: [],
    losingItems: [],
    totalWinAmount: 0,
    allItems: [],
};

interface SettleResolvedMarketsModalProps {
    onOpenChange: (open: boolean) => void;
    proxyAddress: Address;
    winningItems: PolymarketPosition[];
    totalWinAmount: number;
}

export function SettleResolvedMarketsModal({
    onOpenChange,
    proxyAddress,
    winningItems,
    totalWinAmount,
}: SettleResolvedMarketsModalProps) {
    const config = useConfig();
    const queryClient = useQueryClient();

    // Build claim items for batch API (only winning items)
    const claimItems = useMemo(() => {
        return winningItems.map(toClaimItem).filter((item): item is PolymarketClaimV2Item => Boolean(item));
    }, [winningItems]);

    const { mutate, isPending } = useMutation({
        mutationKey: ['polymarket-settle-resolved-markets', proxyAddress],
        async mutationFn() {
            store.set(showEmbeddedWalletUIAtom, false);
            const signature = await signMessage(config, { message: POLYMARKET_CLAIM_ORIGINAL_MESSAGE });
            const data = await getFireflyEndpoint().polymarketBatchClaimV2({
                items: claimItems,
                original_message: POLYMARKET_CLAIM_ORIGINAL_MESSAGE,
                signature_message: signature,
            });
            await waitForTransactionReceipt(config, {
                hash: data.hash as Hash,
                chainId: polygon.id,
                retryCount: 15,
                timeout: 1000 * 60 * 2,
            });
            return data;
        },
        async onSuccess() {
            toast.success(<Trans>Claim requested</Trans>);
            onOpenChange(false);

            const proxy = proxyAddress.toLowerCase();
            // Optimistically hide section immediately by clearing cached data
            queryClient.setQueryData(['polymarket-settlable-positions', proxy], EMPTY_SETTLABLE_POSITIONS);
            queryClient.setQueryData(['polymarket-claimable-proceeds', proxy], { items: [], totalWon: 0 });

            // Force refresh immediately
            await Promise.all([
                queryClient.refetchQueries({ queryKey: ['polymarket-positions', proxy], exact: true, type: 'all' }),
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
                data: { action: 'settle-markets', address: proxyAddress },
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

    return (
        <DialogOrDrawerContent className="w-full gap-4 rounded-t-2xl">
            <DialogOrDrawerHeader className="shrink-0 !flex-row py-5">
                <DialogOrDrawerTitle className="flex justify-start">
                    <Trans>Claim all the winnings</Trans>
                </DialogOrDrawerTitle>
            </DialogOrDrawerHeader>

            <div className="flex flex-col gap-6">
                <div className="no-scrollbar flex max-h-[320px] min-h-0 w-full flex-col gap-4 overflow-auto px-2">
                    <div className="flex flex-col items-center gap-2">
                        <ClaimProceedsSuccessIcon width={64} height={64} />
                        <div className="flex flex-col items-center leading-6">
                            <div className="text-main text-base font-semibold">
                                <Trans>You won</Trans>
                            </div>
                            <div className="text-success text-lg font-bold">{formatPnlUSD(totalWinAmount)}</div>
                        </div>
                        <div className="text-second text-center text-sm font-medium leading-[18px]">
                            <Trans>Great job predicting the future!</Trans>
                        </div>
                    </div>
                    {winningItems.map((x) => {
                        const betUsd = BigNumber(x.shares ?? 0).times(x.avg_price ?? 0);
                        const betText = formatPnlUSD(betUsd.toString());
                        const wonText = formatPnlUSD(x.shares ?? 0);

                        const pctText = formatPnlPercent(x.pnl_rate ?? 0);

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
                                            <span className="text-success">
                                                {wonText}({pctText})
                                            </span>
                                        </Trans>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

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
    );
}

function toClaimItem(position: PolymarketPosition): PolymarketClaimV2Item | null {
    if (!position.conditionId) return null;

    const negRisk = Boolean(position.negRisk);
    const amount = computeClaimAmount({
        negRisk,
        isWin: Boolean(position.isWin),
        shares: Number(position.shares),
        cur_price: Number(position.cur_price),
        offset: Number(position.offset ?? 0),
    });

    return {
        condition_id: position.conditionId,
        negative_risk: negRisk,
        ...(amount ? { amount } : {}),
    };
}

function formatPnlPercent(rate: number): string {
    const text = formatPercentRateMin(rate, { decimals: 2, minPercent: 0.01 });
    if (rate <= 0 || text.startsWith('+') || text.startsWith('-')) return text;
    return `+${text}`;
}
