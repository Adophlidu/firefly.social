import ClaimIcon from '@dimensiondev/assets/claim-proceeds-success.svg';
import CloseIcon from '@dimensiondev/assets/close.svg';
import WarnIcon from '@dimensiondev/assets/warn.svg';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { Trans } from '@lingui/react/macro';
import { type InfiniteData, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { type PropsWithChildren, type ReactNode, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useConfig } from 'wagmi';
import { signMessage } from 'wagmi/actions';

import {
    DialogOrDrawer,
    DialogOrDrawerClose,
    DialogOrDrawerContent,
    DialogOrDrawerTrigger,
} from '@/components/DialogOrDrawer.js';
import { Button } from '@/components/ui/button.js';
import { formatPnlUSD } from '@/helpers/formatPnlUSD.js';
import { computeClaimAmount } from '@/helpers/polymarketClaim.js';
import { cn } from '@/lib/utils.js';
import { type PolymarketPosition } from '@/providers/types/Firefly.js';
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

    interface PositionsPage {
        data?: PolymarketPosition[];
        cursor?: string | null;
    }
    const proxy = account.proxyAddress.toLowerCase();
    const positionsQueryKey = ['polymarket-positions', proxy] as const;
    const claimableQueryKey = ['polymarket-claimable-proceeds', proxy] as const;

    const { mutate, isPending } = useMutation({
        async mutationFn() {
            store.set(showEmbeddedWalletUIAtom, false);
            const signature = await signMessage(config, { message: POLYMARKET_CLAIM_ORIGINAL_MESSAGE });
            return getFireflyEndpoint().polymarketClaimV1({
                condition_id: position.conditionId,
                negative_risk: Boolean(position.negRisk),
                ...(claimAmount ? { amount: claimAmount } : {}),
                original_message: POLYMARKET_CLAIM_ORIGINAL_MESSAGE,
                signature_message: signature,
            });
        },
        async onSuccess() {
            toast.success(isWin ? <Trans>Claim requested</Trans> : <Trans>Position closed</Trans>);
            handleOpenChange(false);
            if (proxy) {
                const targetId = position.Id || position.conditionId;
                // Cancel in-flight refetches so they don't overwrite our optimistic update
                await queryClient.cancelQueries({ queryKey: positionsQueryKey, exact: true });
                queryClient.setQueryData<InfiniteData<PositionsPage>>(positionsQueryKey, (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: old.pages.map((p) => ({
                            ...p,
                            data: (p.data ?? []).filter((x) => (x.Id || x.conditionId) !== targetId),
                        })),
                    };
                });
                // Don't refetch positions immediately — V1 claim API doesn't wait for
                // on-chain confirmation, so the backend still returns stale data.
                // The optimistic removal handles the UI; the list will sync on next
                // focus/remount once the backend has processed the claim.
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
                    <div className="text-main flex-1 text-left text-lg font-bold leading-[22px]">{title}</div>
                    <DialogOrDrawerClose asChild>
                        <button type="button" className="text-second shrink-0" aria-label="Close">
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
                        <div className="text-main text-center text-base font-semibold leading-6">
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

                    <div className="text-second text-center text-sm font-medium leading-[18px]">
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
                        onClick={() => mutate()}
                    >
                        {primaryButtonText}
                    </Button>
                </div>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
}
