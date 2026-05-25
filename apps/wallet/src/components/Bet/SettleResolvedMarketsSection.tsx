import betImageFallback from '@dimensiondev/assets/bet-image-fallback.svg?url';
import { Trans } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { lazy, Suspense, useState } from 'react';
import type { Address } from 'viem';

import { DialogOrDrawer, DialogOrDrawerTrigger } from '@/components/DialogOrDrawer.js';
import { Image } from '@/components/Image.js';
import { formatPnlUSD } from '@/helpers/formatPnlUSD.js';
import { getPolymarketClaimableProceedsQueryOptions } from '@/queries/firefly/getPolymarketClaimableProceedsQueryOptions.js';

const SettleResolvedMarketsModal = lazy(() =>
    import('@/components/Bet/SettleResolvedMarketsModal.js').then((m) => ({ default: m.SettleResolvedMarketsModal })),
);

export function SettleResolvedMarketsSection({ proxyAddress }: { proxyAddress: Address }) {
    const [open, setOpen] = useState(false);

    const { data } = useSuspenseQuery(getPolymarketClaimableProceedsQueryOptions(proxyAddress));
    const { items: winningItems, totalWon: totalWinAmount } = data;

    // Only render if there are winning positions to claim
    if (winningItems.length === 0) return null;

    // Get up to 3 avatars from winning positions
    const previewItems = winningItems.slice(0, 3);
    const totalWonText = formatPnlUSD(totalWinAmount);

    return (
        <DialogOrDrawer open={open} onOpenChange={setOpen}>
            <DialogOrDrawerTrigger asChild>
                <button
                    type="button"
                    className="box-border flex w-full items-center justify-between gap-3 rounded-xl border border-success/20 bg-[radial-gradient(circle_at_0%_100%,#e9ffe6_0%,#ffffff_58%)] p-4 font-inter shadow-[0_8px_8px_rgba(0,0,0,0.08)] dark:bg-lightBg dark:bg-none"
                >
                    <span className="flex flex-col items-start justify-center text-left">
                        <span className="text-sm font-semibold leading-5 text-success">{totalWonText}</span>
                        <span className="text-xs leading-[14px] text-second">
                            <Trans>Claim all the winnings</Trans>
                        </span>
                    </span>
                    <span className="flex items-center gap-3">
                        <span className="inline-flex -space-x-4">
                            {previewItems.map((x, idx) => (
                                <span
                                    key={`${x.conditionId}-${idx}`}
                                    className="inline-block size-10 overflow-hidden rounded-lg border-2 border-lightBottom bg-lightBg shadow-sm"
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

            <Suspense fallback={null}>
                <SettleResolvedMarketsModal
                    onOpenChange={setOpen}
                    proxyAddress={proxyAddress}
                    winningItems={winningItems}
                    totalWinAmount={totalWinAmount}
                />
            </Suspense>
        </DialogOrDrawer>
    );
}
