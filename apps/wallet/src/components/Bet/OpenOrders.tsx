import betImageFallback from '@dimensiondev/assets/bet-image-fallback.svg?url';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { Trans } from '@lingui/react/macro';
import {
    type InfiniteData,
    useMutation,
    useQueryClient,
    useSuspenseInfiniteQuery,
    useSuspenseQuery,
} from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';

import {
    DialogOrDrawer,
    DialogOrDrawerClose,
    DialogOrDrawerContent,
    DialogOrDrawerFooter,
    DialogOrDrawerTitle,
    DialogOrDrawerTrigger,
} from '@/components/DialogOrDrawer.js';
import { Image } from '@/components/Image.js';
import { ListInPage } from '@/components/ListInPage.js';
import { Button } from '@/components/ui/button.js';
import { formatPriceToCents } from '@/helpers/formatPriceToCents.js';
import { formatTokenItemAmount } from '@/helpers/formatTokenItemAmount.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { multipliedBy } from '@/helpers/number.js';
import { safeBigNumber } from '@/helpers/safeBigNumber.js';
import { cn } from '@/lib/utils.js';
import { polymarketGammaEndpoint } from '@/providers/polymarket/gamma.js';
import { type PolymarketOpenOrderDetail } from '@/providers/types/Firefly.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function OpenOrders() {
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['polymarket-open-orders', account.proxyAddress.toLowerCase()],
        initialPageParam: '0',
        async queryFn({ pageParam }) {
            return getFireflyEndpoint().getPolymarketOpenOrdersList({ cursor: pageParam || '0' });
        },
        getNextPageParam: (lastPage) => {
            const list = lastPage?.list ?? EMPTY_LIST;
            if (!list.length) return undefined;
            return lastPage.cursor ?? undefined;
        },
        select: (data) => {
            return data.pages.flatMap((p) => p.list ?? EMPTY_LIST);
        },
    });

    return (
        <ListInPage<PolymarketOpenOrderDetail>
            className="pt-4"
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `polymarket-open-orders`,
                computeItemKey: (index, item) => `${item.id}-${index}`,
                itemContent: getItemContent,
                context: {
                    footerText: <Trans>No more orders</Trans>,
                },
            }}
            NoResultsFallbackProps={{
                className: 'px-4',
            }}
        />
    );
}

function getItemContent(index: number, item: PolymarketOpenOrderDetail) {
    return <OpenOrderItem item={item} />;
}

function OpenOrderItem({ item }: { item: PolymarketOpenOrderDetail }) {
    const proxyAddress = item.maker_address;
    const marketLabel = item.title || '-';
    const sideRaw = String(item.side || '').toLowerCase();
    const isSell = sideRaw.includes('sell');
    const isBuy = sideRaw.includes('buy');
    const sideLabel = isSell ? <Trans>Sell</Trans> : isBuy ? <Trans>Buy</Trans> : sideRaw ? sideRaw : '-';
    const outcome = item.outcome || '-';

    const totalUsd = multipliedBy(safeBigNumber(item.price, 0), safeBigNumber(item.original_size, 0)).toNumber();
    const priceText = formatPriceToCents(item.price);
    const filled = safeBigNumber(item.size_matched, 0).toString();
    const size = safeBigNumber(item.original_size, 0).toString();
    const sharesText = `${formatTokenItemAmount(filled, 0)} / ${formatTokenItemAmount(size, 0)}`;

    const navigateToDetail = async () => {
        const result = await polymarketGammaEndpoint.getMarketByConditionId(item.market);
        const eventSlug = result.ok ? result.data?.events?.[0]?.slug : undefined;
        if (!eventSlug) {
            toast.error(<Trans>Unable to open this market.</Trans>);
            return;
        }
        iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, {
            path: `/polymarket/event/${encodeURIComponent(eventSlug)}`,
        });
    };

    return (
        <div className="w-full space-y-3 p-4">
            <button type="button" className="w-full space-y-3 text-left" onClick={navigateToDetail}>
                <div className="flex w-full items-center gap-2">
                    <div className="bg-lightBg size-6 min-w-0 shrink-0 overflow-hidden rounded-md">
                        <Image
                            width={24}
                            height={24}
                            src={item.icon}
                            alt={item.title}
                            fallback={betImageFallback}
                            className="size-full object-cover"
                        />
                    </div>
                    <div className="text-main line-clamp-2 min-w-0 text-sm font-semibold leading-5">{marketLabel}</div>
                </div>

                <div className="w-full space-y-2">
                    <div className="grid w-full grid-cols-2 gap-2">
                        <div className="flex flex-col">
                            <div className={cn('font-bedstead text-sm font-bold leading-5')}>
                                <span className="capitalize">{sideLabel}</span>-
                                <span className={cn(isSell ? 'text-danger' : 'text-success')}>{outcome}</span>
                            </div>
                            <div className="text-second text-xs leading-4">
                                <Trans>Outcome</Trans>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-main text-sm font-semibold leading-5">
                                {formatTokenUSD(totalUsd, { minDisplay: 0.01 })}
                            </div>
                            <div className="text-second text-xs leading-4">
                                <Trans>Total</Trans>
                            </div>
                        </div>
                    </div>
                    <div className="grid w-full grid-cols-2 gap-2">
                        <div className="flex flex-col">
                            <div className="text-main text-sm font-semibold leading-5">{priceText}</div>
                            <div className="text-second text-xs leading-4">
                                <Trans>Price</Trans>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-main text-sm font-semibold leading-5">{sharesText}</div>
                            <div className="text-second text-xs leading-4">
                                <Trans>Shares</Trans>
                            </div>
                        </div>
                    </div>
                </div>
            </button>

            <CancelPolymarketOrderModal proxyAddress={proxyAddress} orderId={item.id}>
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className={cn('border-third text-main h-10 w-full rounded-[10px] active:scale-[0.99]')}
                >
                    <Trans>Cancel</Trans>
                </Button>
            </CancelPolymarketOrderModal>
        </div>
    );
}

function CancelPolymarketOrderModal({
    proxyAddress,
    orderId,
    children,
}: {
    proxyAddress: string;
    orderId: string;
    children: ReactNode;
}) {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);

    interface OpenOrdersPage {
        list: PolymarketOpenOrderDetail[];
        cursor: string | null;
    }
    const openOrdersQueryKey = ['polymarket-open-orders', proxyAddress.toLowerCase()] as const;

    const { mutateAsync, isPending } = useMutation({
        mutationKey: ['polymarket-cancel-order', proxyAddress.toLowerCase(), orderId],
        async mutationFn() {
            return getFireflyEndpoint().cancelPolymarketOrder(orderId);
        },
        onMutate() {
            toast.dismiss();
            toast.loading(<Trans>Cancelling order...</Trans>, { id: 'cancel-order' });

            const previous = queryClient.getQueryData<InfiniteData<OpenOrdersPage>>(openOrdersQueryKey);
            queryClient.setQueryData<InfiniteData<OpenOrdersPage>>(openOrdersQueryKey, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((p) => ({ ...p, list: (p.list ?? []).filter((x) => x.id !== orderId) })),
                };
            });
            return { previous };
        },
        onSuccess() {
            toast.dismiss('cancel-order');
            toast.success(<Trans>Order cancelled</Trans>);
        },
        onError(error) {
            toast.dismiss('cancel-order');
            toast.error(<Trans>Failed to cancel order</Trans>, { description: error?.message ?? String(error) });
        },
    });

    return (
        <DialogOrDrawer open={open} onOpenChange={setOpen}>
            <DialogOrDrawerTrigger asChild>{children}</DialogOrDrawerTrigger>
            <DialogOrDrawerContent>
                <div className="flex w-full items-center justify-between py-6">
                    <DialogOrDrawerTitle className="text-main text-left text-xl font-semibold leading-6">
                        <Trans>Cancel order?</Trans>
                    </DialogOrDrawerTitle>
                </div>

                <div className="text-main w-full text-left text-base font-medium leading-5">
                    <Trans>
                        Are you sure you want to cancel this order?
                        <br />
                        Once cancelled, it cannot be restored.
                    </Trans>
                </div>

                <DialogOrDrawerFooter className="grid w-full grid-cols-2 gap-4">
                    <DialogOrDrawerClose asChild>
                        <Button
                            variant="outline"
                            size="lg"
                            className="border-main text-main h-12 w-full rounded-full"
                            disabled={isPending}
                        >
                            <Trans>Skip</Trans>
                        </Button>
                    </DialogOrDrawerClose>
                    <Button
                        variant="primary"
                        size="lg"
                        className="h-12 w-full rounded-full"
                        loading={isPending}
                        onClick={async () => {
                            await mutateAsync();
                            setOpen(false);
                        }}
                    >
                        <Trans>Confirm</Trans>
                    </Button>
                </DialogOrDrawerFooter>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
}
