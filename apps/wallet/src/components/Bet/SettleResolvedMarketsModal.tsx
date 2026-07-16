import betImageFallback from '@dimensiondev/assets/bet-image-fallback.svg?url';
import ClaimProceedsSuccessIcon from '@dimensiondev/assets/claim-proceeds-success.svg';
import SendIcon from '@dimensiondev/assets/send.svg';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { waitForEthereumTransaction } from '@dimensiondev/web3/actions';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Address, Hash } from 'viem';
import { polygon } from 'viem/chains';
import { useConfig } from 'wagmi';

import { PositionShareSheet } from '@/components/Bet/PositionShare.js';
import { DialogOrDrawerContent, DialogOrDrawerHeader, DialogOrDrawerTitle } from '@/components/DialogOrDrawer.js';
import { Image } from '@/components/Image.js';
import { Button } from '@/components/ui/button.js';
import { formatPercentRateMin } from '@/helpers/formatPercentRate.js';
import { formatPnlUSD } from '@/helpers/formatPnlUSD.js';
import { computeClaimAmount } from '@/helpers/polymarketClaim.js';
import { getPositionsQueryKeys } from '@/helpers/polymarketPositionsCache.js';
import { getWinningsShareImagePayload } from '@/helpers/polymarketShareImage.js';
import { usePolymarketShareIdentity } from '@/hooks/usePolymarketShareIdentity.js';
import { useShortShareUrl } from '@/hooks/useShortShareUrl.js';
import { useSignMessageWithPrivy } from '@/hooks/useSignMessageWithPrivy.js';
import type { PolymarketClaimV2Item, PolymarketPosition } from '@/providers/types/Firefly.js';
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
    const signMessage = useSignMessageWithPrivy();
    const [open, setOpen] = useState(false);

    // Build claim items for batch API (only winning items)
    const claimItems = useMemo(() => {
        return winningItems.map(toClaimItem).filter((item): item is PolymarketClaimV2Item => Boolean(item));
    }, [winningItems]);

    const { mutate, isPending } = useMutation({
        mutationKey: ['polymarket-settle-resolved-markets', proxyAddress],
        async mutationFn() {
            store.set(showEmbeddedWalletUIAtom, false);
            const signature = await signMessage(POLYMARKET_CLAIM_ORIGINAL_MESSAGE);
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
            onOpenChange(false);

            // Ask the host to play confetti full-screen; an in-iframe canvas would be clipped to the wallet box.
            if (sharePayload) {
                // Render the share image on the host (web) via the bridge, resolve the (short) link, and
                // open compose with both once ready.
                Promise.all([
                    iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_GENERATE_SHARE_IMAGE, {
                        params: sharePayload.params,
                    }),
                    sharePayload.resolveLink ? sharePayload.resolveLink() : sharePayload.link,
                ])
                    .then(([{ dataUrl }, link]) =>
                        iframeBridgeProvider.request(IframeBridgeMethod.COMPOSE, {
                            text: link,
                            imageUrls: [dataUrl],
                        }),
                    )
                    .catch(() => {});
            }
            iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_CONFETTI, {}).catch(() => {});

            const proxy = proxyAddress.toLowerCase();
            const positionsQueryKeys = getPositionsQueryKeys(proxyAddress);
            // Optimistically hide section immediately by clearing cached data
            queryClient.setQueryData(['polymarket-settlable-positions', proxy], EMPTY_SETTLABLE_POSITIONS);
            queryClient.setQueryData(['polymarket-claimable-proceeds', proxy], []);

            // Force refresh immediately
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

    const shareIdentity = usePolymarketShareIdentity(proxyAddress);
    const rawSharePayload = getWinningsShareImagePayload(winningItems, totalWinAmount, proxyAddress, shareIdentity);
    // The share URL is already absolute with `sid` baked in — resolve the short link lazily at share
    // time, not upfront on render.
    const { register: registerShareLink } = useShortShareUrl(rawSharePayload?.link ?? '');
    const sharePayload = rawSharePayload ? { ...rawSharePayload, resolveLink: registerShareLink } : null;

    return (
        <DialogOrDrawerContent className="w-full gap-4 rounded-t-2xl">
            <DialogOrDrawerHeader className="shrink-0 !flex-row items-center py-5">
                <DialogOrDrawerTitle className="flex justify-start">
                    <Trans>Claim all the winnings</Trans>
                </DialogOrDrawerTitle>
            </DialogOrDrawerHeader>

            <div className="flex flex-col gap-6">
                <div className="no-scrollbar flex max-h-[320px] min-h-0 w-full flex-col gap-4 overflow-auto px-2">
                    <div className="flex flex-col items-center gap-2">
                        <ClaimProceedsSuccessIcon width={64} height={64} />
                        <div className="flex flex-col items-center leading-6">
                            <div className="text-base font-semibold text-main">
                                <Trans>You won</Trans>
                            </div>
                            <div className="text-lg font-bold text-success">{formatPnlUSD(totalWinAmount)}</div>
                        </div>
                        <div className="text-center text-sm font-medium leading-[18px] text-second">
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
                                <div className="size-10 overflow-hidden rounded-lg bg-lightBg">
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
                                    <div className="line-clamp-1 text-sm font-semibold leading-5 text-second">
                                        {x.title}
                                    </div>
                                    <div className="text-base font-semibold leading-6 text-main">
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

                <div className="flex items-center gap-2.5">
                    <Button
                        type="button"
                        size="lg"
                        variant="primary"
                        className="h-10 flex-1 rounded-full font-bold"
                        loading={isPending}
                        disabled={!claimItems.length}
                        onClick={() => mutate()}
                    >
                        <Trans>Claim winnings</Trans>
                    </Button>
                    {sharePayload ? (
                        <>
                            <button
                                onClick={() => setOpen(true)}
                                className="flex h-10 w-14 shrink-0 items-center justify-center rounded-full border border-secondaryLine"
                            >
                                <SendIcon className="text-main" width={20} height={20} />
                            </button>
                            <PositionShareSheet payload={sharePayload} open={open} onOpenChange={setOpen} />
                        </>
                    ) : null}
                </div>
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
