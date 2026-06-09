import ClaimIcon from '@dimensiondev/assets/claim-proceeds-success.svg';
import CloseIcon from '@dimensiondev/assets/close.svg';
import WarnIcon from '@dimensiondev/assets/warn.svg';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { waitForEthereumTransaction } from '@dimensiondev/web3/actions';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { type PropsWithChildren, type ReactNode, useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { Hash } from 'viem';
import { polygon } from 'viem/chains';
import { useConfig } from 'wagmi';

import {
    DialogOrDrawer,
    DialogOrDrawerClose,
    DialogOrDrawerContent,
    DialogOrDrawerTrigger,
} from '@/components/DialogOrDrawer.js';
import { Button } from '@/components/ui/button.js';
import { formatPnlUSD } from '@/helpers/formatPnlUSD.js';
import { computeClaimAmount } from '@/helpers/polymarketClaim.js';
import { getPositionsQueryKeys, optimisticRemovePosition } from '@/helpers/polymarketPositionsCache.js';
import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';
import { useSignMessageWithPrivy } from '@/hooks/useSignMessageWithPrivy.js';
import { cn } from '@/lib/utils.js';
import type { PolymarketPosition } from '@/providers/types/Firefly.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { showEmbeddedWalletUIAtom } from '@/store/embeddedWallets.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';
import { store } from '@/store/index.js';

const POLYMARKET_CLAIM_ORIGINAL_MESSAGE = 'polymarket claim proceed';

interface Props {
    position: PolymarketPosition;
    children?: ReactNode;
    open?: boolean;
    onClose?: () => void;
}

export function PositionClaimModal({ position, children, open: controlledOpen, onClose }: PropsWithChildren<Props>) {
    const config = useConfig();
    const signMessage = useSignMessageWithPrivy();
    const queryClient = useQueryClient();
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const [internalOpen, setInternalOpen] = useState(false);

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

    const handleOpenChange = useCallback(
        (newOpen: boolean) => {
            if (controlledOpen !== undefined) {
                if (!newOpen) onClose?.();
            } else {
                setInternalOpen(newOpen);
            }
        },
        [controlledOpen, onClose],
    );

    const isWin = Boolean(position.isWin);
    const title = isWin ? <Trans>Claim winnings</Trans> : <Trans>Close lost position</Trans>;
    const primaryButtonText = isWin ? <Trans>Claim winnings</Trans> : <Trans>Close position</Trans>;

    // Cost = shares * avg_price; Profit = shares won ($1 each) - cost; Loss = cost
    const cost = position.shares * position.avg_price;
    const displayAmount = isWin ? position.shares - cost : cost;
    const displayAmountText = formatPnlUSD(Math.abs(Number(displayAmount) || 0));

    const claimAmount = computeClaimAmount({
        negRisk: Boolean(position.negRisk),
        isWin: Boolean(position.isWin),
        shares: Number(position.shares),
        cur_price: Number(position.cur_price),
        offset: Number(position.offset ?? 0),
    });

    const proxy = account.proxyAddress.toLowerCase();
    const positionsQueryKeys = getPositionsQueryKeys(account.proxyAddress);
    const claimableQueryKey = ['polymarket-claimable-proceeds', proxy] as const;

    const { mutate, isPending } = useMutation({
        async mutationFn() {
            store.set(showEmbeddedWalletUIAtom, false);
            const signature = await signMessage(POLYMARKET_CLAIM_ORIGINAL_MESSAGE);
            const data = await getFireflyEndpoint().polymarketBatchClaimV2({
                items: [
                    {
                        condition_id: position.conditionId,
                        negative_risk: Boolean(position.negRisk),
                        ...(claimAmount ? { amount: claimAmount } : {}),
                    },
                ],
                original_message: POLYMARKET_CLAIM_ORIGINAL_MESSAGE,
                signature_message: signature,
            });
            await waitForEthereumTransaction(config, polygon.id, data.hash as Hash);
            return data;
        },
        async onSuccess() {
            toast.success(isWin ? <Trans>Claim requested</Trans> : <Trans>Position closed</Trans>);
            handleOpenChange(false);
            if (proxy) {
                // Cancel in-flight refetches so they don't overwrite our optimistic update
                await queryClient.cancelQueries({ queryKey: positionsQueryKeys.current, exact: true });
                optimisticRemovePosition(queryClient, {
                    proxyAddress: account.proxyAddress,
                    positionId: position.Id,
                    tokenId: position.tokenId,
                });
                queryClient.refetchQueries({ queryKey: positionsQueryKeys.current });
                queryClient.refetchQueries({ queryKey: claimableQueryKey, exact: true });

                // Notify parent page to refetch
                iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_NOTIFY, {
                    type: 'position-operation',
                    data: { action: isWin ? 'claim-proceeds' : 'close-position', address: proxy },
                });
            }
        },
        onError(error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            toast.error(isWin ? <Trans>Failed to claim winnings</Trans> : <Trans>Failed to close position</Trans>, {
                description: message,
            });
        },
        onSettled() {
            store.set(showEmbeddedWalletUIAtom, true);
        },
    });

    return (
        <DialogOrDrawer open={open} onOpenChange={handleOpenChange}>
            {children ? <DialogOrDrawerTrigger asChild>{children}</DialogOrDrawerTrigger> : null}

            <DialogOrDrawerContent>
                <div className="flex w-full items-center justify-between py-6">
                    <div className="flex-1 text-left text-lg font-bold leading-[22px] text-main">{title}</div>
                    <DialogOrDrawerClose asChild>
                        <button type="button" className="shrink-0 text-second" aria-label="Close">
                            <CloseIcon width={24} height={24} />
                        </button>
                    </DialogOrDrawerClose>
                </div>

                <div className="mb-4 flex w-full flex-col items-center gap-2 px-2">
                    <div className="flex size-16 items-center justify-center rounded-full">
                        {isWin ? (
                            <ClaimIcon width={64} height={64} className="text-success" />
                        ) : (
                            <WarnIcon width={64} height={64} className="text-third" />
                        )}
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="text-center text-base font-semibold leading-6 text-main">
                            {isWin ? <Trans>You won</Trans> : <Trans>You lost</Trans>}
                        </div>
                        <div
                            className={cn(
                                'w-full text-center text-lg font-bold leading-6',
                                isWin ? 'text-success' : 'text-main',
                            )}
                        >
                            {displayAmountText}
                        </div>
                    </div>

                    <div className="text-center text-sm font-medium leading-[18px] text-second">
                        {isWin ? (
                            <Trans>Great job predicting the future!</Trans>
                        ) : (
                            <Trans>Missed this round, but the next prediction is waiting for you!</Trans>
                        )}
                    </div>
                </div>

                <div className="w-full">
                    <Button
                        type="button"
                        size="lg"
                        variant="primary"
                        className="h-10 w-full rounded-full font-bold"
                        loading={isPending}
                        onClick={() => {
                            captureWalletTelemetryEvent(WalletTelemetryEventId.BETS_CLAIM_PROCEEDS_CLICK, {});
                            mutate();
                        }}
                    >
                        {primaryButtonText}
                    </Button>
                </div>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
}
