import { PRIVY_CONNECTOR_ID } from '@dimensiondev/constants/static';
import type { PerpsIntent } from '@dimensiondev/iframe-bridge';
import {
    buildClosePositionOrder,
    canConfirmClose,
    closeAmountToRatio,
    closeRatioToAmount,
    type ComputeMethod,
    computeTpslExpectedPnlUsd,
    formatPrice,
    isValidSize,
    normalizePriceInput,
    type PerpsWalletClient,
    resolvePerpCoinIndex,
    validatePerpsPriceInput,
} from '@dimensiondev/perps-core';
import { usePerpsClient, usePerpsMarkets } from '@dimensiondev/perps-react';
import { Trans } from '@lingui/react/macro';
import type { ClearinghouseStateResponse, FrontendOpenOrdersResponse } from '@nktkas/hyperliquid/api/info';
import { useMutation } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { ArrowLeftRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useConnectors, useWalletClient } from 'wagmi';

import { type AdjustMarginMode, getAdjustMarginInputState } from '@/components/Perps/adjustMarginInput.js';
import { buildPerpsModifyOrder } from '@/components/Perps/buildPerpsModifyOrder.js';
import { buildPerpsPositionTpsl } from '@/components/Perps/buildPerpsPositionTpsl.js';
import { executePerpsCloseAll, PerpsPartialSuccessError } from '@/components/Perps/executePerpsCloseAll.js';
import { getPerpsActionTargetStatus } from '@/components/Perps/getPerpsActionTargetStatus.js';
import { getTopLevelOpenOrders } from '@/components/Perps/getTopLevelOpenOrders.js';
import { PerpsAdjustMarginDrawer } from '@/components/Perps/PerpsAdjustMarginDrawer.js';
import { toPerpsCoinDisplayName, toRawPerpsCoin } from '@/components/Perps/perpsCoin.js';
import { usePerpsMarketData } from '@/components/Perps/usePerpsMarketData.js';
import { useTpSlField } from '@/components/Perps/useTpSlField.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer.js';
import { Spinner } from '@/components/ui/spinner.js';
import { publishPerpsMutation } from '@/helpers/perpsMutation.js';
import { withSkipPinCodeCheck } from '@/helpers/withSkipPinCodeCheck.js';
import { cn } from '@/lib/utils.js';

type ActionIntent = Exclude<PerpsIntent, { kind: 'account' | 'deposit' | 'withdraw' | 'place-order' }>;
type Position = ClearinghouseStateResponse['assetPositions'][number]['position'];

interface Props {
    intent: ActionIntent;
    positions: Position[];
    orders: FrontendOpenOrdersResponse;
    isAccountLoading: boolean;
    isOrdersLoading: boolean;
    withdrawable?: string;
    onClose(): void;
}

function titleForIntent(kind: ActionIntent['kind']) {
    switch (kind) {
        case 'add-margin':
            return <Trans>Add Margin</Trans>;
        case 'edit-tpsl':
            return <Trans>Take Profit / Stop Loss</Trans>;
        case 'market-close':
            return <Trans>Market Close</Trans>;
        case 'limit-close':
            return <Trans>Limit Close</Trans>;
        case 'modify-order':
            return <Trans>Modify Order</Trans>;
        case 'cancel-order':
            return <Trans>Cancel Order</Trans>;
        case 'cancel-all':
            return <Trans>Cancel All Orders</Trans>;
        case 'close-all':
            return <Trans>Close All Positions</Trans>;
    }
}

export function PerpsActionSheet({
    intent,
    positions,
    orders,
    isAccountLoading,
    isOrdersLoading,
    withdrawable,
    onClose,
}: Props) {
    const client = usePerpsClient();
    const markets = usePerpsMarkets();
    const connectors = useConnectors();
    const { data: walletClient } = useWalletClient({
        connector: connectors.find((connector) => connector.id === PRIVY_CONNECTOR_ID),
    });
    const targetCoin = 'coin' in intent && intent.coin ? toRawPerpsCoin(intent.coin) : (positions[0]?.coin ?? 'BTC');
    const targetCoinDisplayName = toPerpsCoinDisplayName(targetCoin);
    const { coinInfo } = usePerpsMarketData(targetCoin);
    const [amount, setAmount] = useState('');
    const [marginAdjustMode, setMarginAdjustMode] = useState<AdjustMarginMode>('add');
    const [amountRatio, setAmountRatio] = useState(0);
    const [price, setPrice] = useState('');
    const closeDefaultsKeyRef = useRef('');
    const targetPosition = useMemo(
        () => positions.find((position) => position.coin === targetCoin),
        [positions, targetCoin],
    );
    const targetOrder = useMemo(
        () =>
            'orderId' in intent
                ? orders.find((order) => String(order.oid) === intent.orderId && order.coin === targetCoin)
                : undefined,
        [intent, orders, targetCoin],
    );
    const positionTpsl = useMemo(() => {
        const positionOrders = orders.filter(
            (order) => order.coin === targetCoin && order.isPositionTpsl && (order.sz === '0' || order.sz === '0.0'),
        );
        return {
            tp: positionOrders.find((order) => order.orderType.startsWith('Take Profit')),
            sl: positionOrders.find((order) => order.orderType.startsWith('Stop')),
        };
    }, [orders, targetCoin]);
    const targetStatus = getPerpsActionTargetStatus({
        intent,
        hasPosition: Boolean(targetPosition),
        hasOrder: Boolean(targetOrder),
        isAccountLoading,
        isOrdersLoading,
        isMarketsLoading: markets.isLoading,
    });
    const isTargetLoading =
        targetStatus === 'loading' ||
        (targetStatus === 'ready' && ('positionId' in intent || 'orderId' in intent) && !coinInfo);
    const isTargetMissing = targetStatus === 'missing';
    const absolutePositionSize = targetPosition ? new BigNumber(targetPosition.szi).abs().toFixed() : '0';
    const markPrice =
        coinInfo?.assetCtx?.markPx ??
        (targetPosition && new BigNumber(targetPosition.szi).abs().gt(0)
            ? new BigNumber(targetPosition.positionValue).dividedBy(new BigNumber(targetPosition.szi).abs()).toFixed()
            : undefined);
    const midPrice = coinInfo?.assetCtx?.midPx ?? markPrice;

    useEffect(() => {
        if (!targetPosition || !coinInfo || (intent.kind !== 'market-close' && intent.kind !== 'limit-close')) return;
        if (intent.kind === 'limit-close' && !midPrice) return;
        const defaultsKey = `${intent.kind}:${targetPosition.coin}:${targetPosition.szi}`;
        if (closeDefaultsKeyRef.current === defaultsKey) return;
        closeDefaultsKeyRef.current = defaultsKey;
        setAmount(absolutePositionSize);
        setAmountRatio(100);
        setPrice(intent.kind === 'limit-close' && midPrice ? formatPrice(midPrice, coinInfo.szDecimals) : '');
    }, [absolutePositionSize, coinInfo, intent.kind, midPrice, targetPosition]);

    const tpslSide = new BigNumber(targetPosition?.szi ?? '0').gt(0) ? 'long' : 'short';
    const tpslReferencePrice = targetPosition?.entryPx ?? '';
    const tpslLeverage = targetPosition?.leverage.value ?? 1;
    const tpslSzDecimals = coinInfo?.szDecimals ?? 0;
    const tpslContext = {
        isLong: tpslSide === 'long',
        entryPrice: tpslReferencePrice,
        leverage: tpslLeverage,
        size: absolutePositionSize,
        szDecimals: tpslSzDecimals,
        initialMethod: 'ratio' as const,
    };
    const tpField = useTpSlField({ ...tpslContext, isTp: true });
    const slField = useTpSlField({ ...tpslContext, isTp: false });
    const changeTpslPrice = (field: typeof tpField, rawValue: string) => {
        const normalized = normalizePriceInput(rawValue);
        if (normalized && !validatePerpsPriceInput(normalized, tpslSzDecimals)) return;
        field.changePrice(normalized);
    };

    const mutation = useMutation({
        mutationFn: () =>
            withSkipPinCodeCheck(async () => {
                if (!walletClient) throw new Error('Wallet is unavailable.');
                if (!markets.data) throw new Error('Market metadata is unavailable.');
                const exchange = client.createExchangeClient(walletClient as PerpsWalletClient);

                if (intent.kind === 'cancel-order') {
                    if (!targetOrder || !coinInfo) throw new Error('The order is no longer available.');
                    await exchange.cancel({ cancels: [{ a: coinInfo.index, o: targetOrder.oid }] });
                    return;
                }
                if (intent.kind === 'modify-order') {
                    if (!targetOrder || !coinInfo) throw new Error('The order is no longer available.');
                    await exchange.modify(
                        buildPerpsModifyOrder({
                            order: targetOrder,
                            asset: coinInfo.index,
                            szDecimals: coinInfo.szDecimals,
                            field: intent.field,
                            value: intent.value,
                        }),
                    );
                    return;
                }
                if (intent.kind === 'cancel-all') {
                    const selected = getTopLevelOpenOrders(
                        intent.coin ? orders.filter((order) => order.coin === targetCoin) : orders,
                    );
                    const cancels = selected.map((order) => ({
                        a: resolvePerpCoinIndex(order.coin, markets.data!),
                        o: order.oid,
                    }));
                    if (!cancels.length) throw new Error('There are no open orders.');
                    await exchange.cancel({ cancels });
                    return;
                }
                if (intent.kind === 'close-all') {
                    const selected = intent.coin
                        ? positions.filter((position) => position.coin === targetCoin)
                        : positions;
                    const closeOrders = selected.flatMap((position) => {
                        const metadata = markets.data!;
                        const asset = resolvePerpCoinIndex(position.coin, metadata);
                        const universe = metadata.flatMap((entry) => entry.universe);
                        const meta = universe.find((entry) => entry.name === position.coin);
                        const size = new BigNumber(position.szi).abs();
                        const mark = size.gt(0)
                            ? new BigNumber(position.positionValue).dividedBy(size)
                            : new BigNumber(0);
                        if (asset < 0 || !meta || mark.lte(0)) return [];
                        return buildClosePositionOrder({
                            asset,
                            positionSize: position.szi,
                            price: mark.toFixed(),
                            size: size.toFixed(meta.szDecimals, BigNumber.ROUND_DOWN),
                            szDecimals: meta.szDecimals,
                            orderType: 'market',
                        }).orders;
                    });
                    if (!closeOrders.length) throw new Error('There are no positions to close.');
                    const selectedOrders = getTopLevelOpenOrders(
                        intent.coin ? orders.filter((order) => order.coin === targetCoin) : orders,
                    );
                    const toCancels = (selected: typeof selectedOrders) =>
                        selected.map((order) => ({
                            a: resolvePerpCoinIndex(order.coin, markets.data!),
                            o: order.oid,
                        }));
                    const openingCancels = toCancels(selectedOrders.filter((order) => !order.reduceOnly));
                    const reduceOnlyCancels = toCancels(selectedOrders.filter((order) => order.reduceOnly));
                    await executePerpsCloseAll({
                        cancelOpeningOrders: openingCancels.length
                            ? async () => {
                                  await exchange.cancel({ cancels: openingCancels });
                              }
                            : undefined,
                        closePositions: async () => {
                            await exchange.order({ grouping: 'na', orders: closeOrders });
                        },
                        cancelReduceOnlyOrders: reduceOnlyCancels.length
                            ? async () => {
                                  await exchange.cancel({ cancels: reduceOnlyCancels });
                              }
                            : undefined,
                    });
                    return;
                }
                if (!targetPosition || !coinInfo) throw new Error('The position is no longer available.');

                if (intent.kind === 'add-margin') {
                    if (targetPosition.leverage.type !== 'isolated')
                        throw new Error('Margin can only be added to isolated positions.');
                    const input = getAdjustMarginInputState({
                        amount,
                        mode: marginAdjustMode,
                        withdrawable,
                        currentMargin: targetPosition.marginUsed,
                        positionValue: targetPosition.positionValue,
                        leverage: targetPosition.leverage.value,
                        canRemove: coinInfo.marginMode !== 'strictIsolated',
                    });
                    if (!input.isValid || !input.submitAmount) {
                        if (input.error === 'below-minimum') throw new Error('The minimum margin amount is 0.01 USDC.');
                        if (input.error === 'exceeds-available')
                            throw new Error('The amount exceeds the available margin.');
                        if (input.error === 'remove-disabled')
                            throw new Error('Margin cannot be removed from this market.');
                        throw new Error('Enter a valid margin amount with no more than 2 decimal places.');
                    }
                    const value = new BigNumber(input.submitAmount);
                    await exchange.updateIsolatedMargin({
                        asset: coinInfo.index,
                        isBuy: new BigNumber(targetPosition.szi).gt(0),
                        ntli: value
                            .multipliedBy(marginAdjustMode === 'remove' ? -1 : 1)
                            .multipliedBy(1e6)
                            .integerValue(BigNumber.ROUND_DOWN)
                            .toNumber(),
                    });
                    return;
                }
                if (intent.kind === 'edit-tpsl') {
                    const isLong = new BigNumber(targetPosition.szi).gt(0);
                    await exchange.order(
                        buildPerpsPositionTpsl({
                            asset: coinInfo.index,
                            isLong,
                            markPrice: markPrice ?? '0',
                            szDecimals: coinInfo.szDecimals,
                            tpPrice: positionTpsl.tp ? undefined : tpField.priceDisplay,
                            slPrice: positionTpsl.sl ? undefined : slField.priceDisplay,
                        }),
                    );
                    return;
                }

                const size = new BigNumber(amount || targetPosition.szi).abs();
                const closePrice = intent.kind === 'market-close' ? markPrice : price;
                if (!closePrice || new BigNumber(closePrice).lte(0)) throw new Error('Enter a limit price.');
                if (intent.kind === 'limit-close' && !validatePerpsPriceInput(closePrice, coinInfo.szDecimals)) {
                    throw new Error('Enter a valid limit price.');
                }
                if (!size.isFinite() || size.lte(0) || size.gt(new BigNumber(targetPosition.szi).abs()))
                    throw new Error('Enter a valid close size.');
                await exchange.order(
                    buildClosePositionOrder({
                        asset: coinInfo.index,
                        positionSize: targetPosition.szi,
                        price: closePrice,
                        size: size.toFixed(coinInfo.szDecimals, BigNumber.ROUND_DOWN),
                        szDecimals: coinInfo.szDecimals,
                        orderType: intent.kind === 'market-close' ? 'market' : 'limit',
                    }),
                );
            }),
        async onSuccess() {
            await publishPerpsMutation(intent.kind, 'success', {
                ...('coin' in intent ? { coin: intent.coin } : {}),
                ...('positionId' in intent ? { positionId: intent.positionId } : {}),
                ...('orderId' in intent ? { orderId: intent.orderId } : {}),
            });
            toast.success(<Trans>Action submitted.</Trans>);
            onClose();
        },
        async onError(error) {
            const message = error instanceof Error ? error.message : 'Action failed.';
            const isPartialSuccess = error instanceof PerpsPartialSuccessError;
            await publishPerpsMutation(intent.kind, 'failed', { message, partial: isPartialSuccess });
            toast.error(isPartialSuccess ? <Trans>Action partially completed.</Trans> : <Trans>Action failed.</Trans>, {
                description: message,
            });
        },
    });
    const cancelTpslMutation = useMutation({
        mutationFn: (orderId: number) =>
            withSkipPinCodeCheck(async () => {
                if (!walletClient || !coinInfo) throw new Error('Wallet or market is unavailable.');
                const exchange = client.createExchangeClient(walletClient as PerpsWalletClient);
                await exchange.cancel({ cancels: [{ a: coinInfo.index, o: orderId }] });
            }),
        async onSuccess() {
            toast.success(<Trans>TP/SL canceled.</Trans>);
        },
        onError(error) {
            toast.error(<Trans>Action failed.</Trans>, {
                description: error instanceof Error ? error.message : 'Failed to cancel TP/SL.',
            });
        },
    });

    const isClose = intent.kind === 'market-close' || intent.kind === 'limit-close';
    const isConfirmation =
        intent.kind === 'cancel-order' || intent.kind === 'cancel-all' || intent.kind === 'close-all';

    if (intent.kind === 'add-margin' && targetPosition && coinInfo) {
        return (
            <PerpsAdjustMarginDrawer
                coin={targetCoin}
                amount={amount}
                mode={marginAdjustMode}
                markPrice={markPrice}
                liquidationPrice={targetPosition.liquidationPx}
                currentMargin={targetPosition.marginUsed}
                positionValue={targetPosition.positionValue}
                leverage={targetPosition.leverage.value}
                withdrawable={withdrawable}
                canRemove={coinInfo.marginMode !== 'strictIsolated'}
                pending={mutation.isPending}
                onAmountChange={(value) => setAmount(normalizePriceInput(value))}
                onModeChange={(value) => {
                    setMarginAdjustMode(value);
                    setAmount('');
                }}
                onClose={onClose}
                onConfirm={() => mutation.mutate()}
            />
        );
    }

    if (isClose && targetPosition && coinInfo) {
        const closePrice = intent.kind === 'market-close' ? (markPrice ?? '') : price;
        const closeSize = new BigNumber(amount || '0');
        const positionSize = new BigNumber(absolutePositionSize);
        const estimatedPnl =
            closeSize.isFinite() && closeSize.gt(0) && closePrice
                ? new BigNumber(closePrice)
                      .minus(targetPosition.entryPx)
                      .multipliedBy(closeSize)
                      .multipliedBy(new BigNumber(targetPosition.szi).gt(0) ? 1 : -1)
                : null;
        const canClose =
            canConfirmClose(closePrice, amount) &&
            closeSize.lte(positionSize) &&
            (closeSize.decimalPlaces() ?? 0) <= coinInfo.szDecimals &&
            (intent.kind === 'market-close' || validatePerpsPriceInput(price, coinInfo.szDecimals));
        return (
            <ClosePositionDrawer
                type={intent.kind === 'market-close' ? 'market' : 'limit'}
                coin={targetCoin}
                markPrice={markPrice}
                midPrice={midPrice}
                price={price}
                amount={amount}
                amountRatio={amountRatio}
                positionSize={absolutePositionSize}
                estimatedPnl={estimatedPnl}
                disabled={!canClose || mutation.isPending}
                pending={mutation.isPending}
                onPriceChange={(value) => {
                    closeDefaultsKeyRef.current = `${intent.kind}:${targetPosition.coin}:${targetPosition.szi}`;
                    setPrice(normalizePriceInput(value));
                }}
                onUseMid={() => {
                    closeDefaultsKeyRef.current = `${intent.kind}:${targetPosition.coin}:${targetPosition.szi}`;
                    if (midPrice) setPrice(formatPrice(midPrice, coinInfo.szDecimals));
                }}
                onAmountChange={(value) => {
                    closeDefaultsKeyRef.current = `${intent.kind}:${targetPosition.coin}:${targetPosition.szi}`;
                    const normalized = normalizePriceInput(value);
                    setAmount(normalized);
                    setAmountRatio(closeAmountToRatio(absolutePositionSize, normalized));
                }}
                onRatioChange={(ratio) => {
                    closeDefaultsKeyRef.current = `${intent.kind}:${targetPosition.coin}:${targetPosition.szi}`;
                    setAmountRatio(ratio);
                    setAmount(closeRatioToAmount(absolutePositionSize, ratio, coinInfo.szDecimals));
                }}
                onCancel={onClose}
                onConfirm={() => mutation.mutate()}
            />
        );
    }

    if (intent.kind === 'edit-tpsl' && targetPosition && coinInfo) {
        const canSubmitTpsl =
            (!positionTpsl.tp && isValidSize(tpField.priceDisplay)) ||
            (!positionTpsl.sl && isValidSize(slField.priceDisplay));
        return (
            <TpslDrawer
                coin={targetCoin}
                entryPrice={targetPosition.entryPx}
                markPrice={markPrice}
                liquidationPrice={targetPosition.liquidationPx}
                positionSize={absolutePositionSize}
                side={tpslSide}
                existingTp={positionTpsl.tp}
                existingSl={positionTpsl.sl}
                tpPrice={tpField.priceDisplay}
                slPrice={slField.priceDisplay}
                tpGain={tpField.gainDisplay}
                slGain={slField.gainDisplay}
                tpGainMethod={tpField.method}
                slGainMethod={slField.method}
                pending={mutation.isPending || cancelTpslMutation.isPending}
                canSubmit={canSubmitTpsl}
                onTpPriceChange={(value) => changeTpslPrice(tpField, value)}
                onSlPriceChange={(value) => changeTpslPrice(slField, value)}
                onTpGainChange={(value) => tpField.changeGain(normalizePriceInput(value))}
                onSlGainChange={(value) => slField.changeGain(normalizePriceInput(value))}
                onToggleTpGainMethod={tpField.toggleMethod}
                onToggleSlGainMethod={slField.toggleMethod}
                onCancelTp={() => positionTpsl.tp && cancelTpslMutation.mutate(positionTpsl.tp.oid)}
                onCancelSl={() => positionTpsl.sl && cancelTpslMutation.mutate(positionTpsl.sl.oid)}
                onClose={onClose}
                onConfirm={() => mutation.mutate()}
            />
        );
    }

    if ((intent.kind === 'cancel-all' || intent.kind === 'close-all') && !isTargetLoading) {
        const isCancelAll = intent.kind === 'cancel-all';
        return (
            <Drawer
                open
                onOpenChange={(open) => {
                    if (!open) onClose();
                }}
            >
                <DrawerContent
                    className="mx-auto max-w-[800px] rounded-t-[36px] border border-line bg-primaryBottom text-main shadow-[0_16px_20px_rgba(64,61,87,0.1)] dark:shadow-none sm:rounded-t-[36px]"
                    bodyClassName="gap-4 overflow-visible px-4 pb-4 pt-2"
                >
                    <div className="flex flex-col items-center">
                        <div className="h-1 w-12 rounded-full bg-third" />
                        <DrawerTitle className="mt-3 flex-none self-stretch text-left text-xl font-[SF_Pro_Rounded] font-bold leading-6 first:mr-0">
                            {isCancelAll ? <Trans>Cancel all orders</Trans> : <Trans>Close all positions</Trans>}
                        </DrawerTitle>
                    </div>
                    <DrawerDescription className="text-[13px] font-medium leading-[17px] text-second">
                        {isCancelAll ? (
                            <Trans>
                                This will cancel all your open orders, including take-profit and stop-loss orders.
                            </Trans>
                        ) : (
                            <Trans>
                                Your positions will all be closed at market price, and any open orders (or reduce-only
                                orders) will be canceled. Options won't be affected.
                            </Trans>
                        )}
                    </DrawerDescription>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            className="h-12 rounded-full border border-main text-sm font-bold leading-6 text-main"
                            onClick={onClose}
                        >
                            <Trans>Back</Trans>
                        </button>
                        <button
                            type="button"
                            disabled={mutation.isPending}
                            className="h-12 rounded-full bg-main text-base font-bold leading-6 text-primaryBottom disabled:opacity-40"
                            onClick={() => mutation.mutate()}
                        >
                            {mutation.isPending ? <Trans>Submitting…</Trans> : <Trans>Confirm</Trans>}
                        </button>
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Drawer
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DrawerContent
                className="mx-auto max-w-[800px] bg-primaryBottom text-main outline-none focus:outline-none focus-visible:outline-none"
                bodyClassName="px-4"
            >
                <DrawerHeader className="bg-primaryBottom">
                    <DrawerTitle>{titleForIntent(intent.kind)}</DrawerTitle>
                </DrawerHeader>
                {isTargetLoading ? (
                    <div className="flex h-32 items-center justify-center">
                        <Spinner className="size-6 text-highlight" />
                    </div>
                ) : null}
                {isTargetMissing ? (
                    <p role="alert" className="rounded-lg bg-dangerBg p-4 text-sm text-danger">
                        <Trans>The position or order is no longer available. Refresh the web page and try again.</Trans>
                    </p>
                ) : null}
                {!isTargetLoading && !isTargetMissing && intent.kind === 'add-margin' ? (
                    <ActionInput label={<Trans>Amount</Trans>} value={amount} onChange={setAmount} suffix="USDC" />
                ) : null}
                {!isTargetLoading && !isTargetMissing && intent.kind === 'edit-tpsl' ? (
                    <div className="grid grid-cols-2 gap-2">
                        <ActionInput
                            label={<Trans>Take Profit</Trans>}
                            value={tpField.priceDisplay}
                            onChange={tpField.changePrice}
                            suffix="USDC"
                        />
                        <ActionInput
                            label={<Trans>Stop Loss</Trans>}
                            value={slField.priceDisplay}
                            onChange={slField.changePrice}
                            suffix="USDC"
                        />
                    </div>
                ) : null}
                {!isTargetLoading && !isTargetMissing && isClose ? (
                    <div className="space-y-3">
                        <ActionInput
                            label={<Trans>Size</Trans>}
                            value={amount}
                            onChange={setAmount}
                            placeholder={targetPosition ? new BigNumber(targetPosition.szi).abs().toFixed() : '0'}
                            suffix={targetCoinDisplayName}
                        />
                        {intent.kind === 'limit-close' ? (
                            <ActionInput
                                label={<Trans>Limit price</Trans>}
                                value={price}
                                onChange={setPrice}
                                suffix="USDC"
                            />
                        ) : null}
                    </div>
                ) : null}
                {!isTargetLoading && !isTargetMissing && intent.kind === 'modify-order' ? (
                    <div className="py-2">
                        <span className="block text-sm text-second">
                            {intent.field === 'size' ? <Trans>Size</Trans> : <Trans>Price</Trans>}
                        </span>
                        <div className="mt-2 flex flex-wrap items-baseline gap-2 text-lg font-semibold leading-6">
                            <span>{intent.field === 'size' ? targetOrder?.sz : targetOrder?.limitPx}</span>
                            <span aria-hidden className="text-third">
                                →
                            </span>
                            <span>{intent.value}</span>
                            <span className="text-sm font-medium text-second">
                                {intent.field === 'size' ? targetCoinDisplayName : 'USDC'}
                            </span>
                        </div>
                        <p className="mt-3 text-[13px] leading-[17px] text-second">
                            <Trans>This action will be submitted to Hyperliquid.</Trans>
                        </p>
                    </div>
                ) : null}
                {!isTargetLoading && !isTargetMissing && isConfirmation ? (
                    <p className="rounded-lg bg-lightBg p-4 text-sm">
                        <Trans>This action will be submitted to Hyperliquid. Please confirm to continue.</Trans>
                    </p>
                ) : null}
                {!isTargetLoading ? (
                    <button
                        type="button"
                        disabled={isTargetMissing || mutation.isPending}
                        className="mb-2 mt-6 h-12 w-full rounded-full bg-main text-base font-bold text-primaryBottom disabled:opacity-40"
                        onClick={() => mutation.mutate()}
                    >
                        {mutation.isPending ? <Trans>Submitting…</Trans> : <Trans>Confirm</Trans>}
                    </button>
                ) : null}
            </DrawerContent>
        </Drawer>
    );
}

function PerpsDrawerFrame({
    title,
    children,
    onClose,
}: {
    title: React.ReactNode;
    children: React.ReactNode;
    onClose(): void;
}) {
    return (
        <Drawer
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DrawerContent
                className="mx-auto max-w-[400px] rounded-t-[36px] border border-line bg-primaryBottom text-main shadow-[0_16px_20px_rgba(64,61,87,0.1)] outline-none focus:outline-none dark:shadow-none sm:rounded-t-[36px]"
                bodyClassName="gap-4 overflow-visible px-4 pb-4 pt-2"
            >
                <div className="flex flex-col items-center">
                    <div className="h-1 w-12 rounded-full bg-third" />
                    <DrawerTitle className="mt-3 flex-none self-stretch text-left text-xl font-[SF_Pro_Rounded] font-bold leading-6 first:mr-0">
                        {title}
                    </DrawerTitle>
                </div>
                {children}
            </DrawerContent>
        </Drawer>
    );
}

function formatPerpsValue(value?: string | null, maximumFractionDigits = 4) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits }) : '--';
}

function PositionSizeSlider({ value, onChange }: { value: number; onChange(value: number): void }) {
    const steps = [0, 25, 50, 75, 100];
    return (
        <div className="relative h-6" aria-label="Close position percentage">
            <div className="pointer-events-none absolute inset-x-[7px] top-1/2 h-0.5 -translate-y-1/2 bg-third" />
            <div
                className="pointer-events-none absolute left-[7px] top-1/2 h-0.5 -translate-y-1/2 bg-main"
                style={{ width: `calc(${value}% - ${value * 0.14}px)` }}
            />
            {steps.map((step) => (
                <span
                    key={step}
                    className={cn(
                        'pointer-events-none absolute top-1/2 z-10 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-primaryBottom',
                        step <= value ? 'border-main' : 'border-third',
                    )}
                    style={{ left: `calc(7px + (100% - 14px) * ${step / 100})` }}
                />
            ))}
            <span
                className="pointer-events-none absolute top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-main bg-primaryBottom"
                style={{ left: `calc(7px + (100% - 14px) * ${value / 100})` }}
            />
            <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={value}
                aria-label="Close position percentage"
                className="absolute inset-0 z-20 size-full cursor-pointer opacity-0"
                onChange={(event) => onChange(Number(event.target.value))}
            />
        </div>
    );
}

function ClosePositionDrawer({
    type,
    coin,
    markPrice,
    midPrice,
    price,
    amount,
    amountRatio,
    positionSize,
    estimatedPnl,
    disabled,
    pending,
    onPriceChange,
    onUseMid,
    onAmountChange,
    onRatioChange,
    onCancel,
    onConfirm,
}: {
    type: 'market' | 'limit';
    coin: string;
    markPrice?: string;
    midPrice?: string;
    price: string;
    amount: string;
    amountRatio: number;
    positionSize: string;
    estimatedPnl: BigNumber | null;
    disabled: boolean;
    pending: boolean;
    onPriceChange(value: string): void;
    onUseMid(): void;
    onAmountChange(value: string): void;
    onRatioChange(value: number): void;
    onCancel(): void;
    onConfirm(): void;
}) {
    const pnlIsNegative = estimatedPnl?.isNegative() ?? false;
    const coinDisplayName = toPerpsCoinDisplayName(coin);
    return (
        <PerpsDrawerFrame
            title={type === 'market' ? <Trans>Market Close</Trans> : <Trans>Limit Close</Trans>}
            onClose={onCancel}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TokenIcon
                        size={30}
                        symbol={coinDisplayName}
                        icon={`https://app.hyperliquid.xyz/coins/${encodeURIComponent(coin)}.svg`}
                    />
                    <span className="text-sm font-semibold leading-[14px]">
                        <Trans>Current Price</Trans>
                    </span>
                </div>
                <strong className="text-base font-semibold leading-5">${formatPerpsValue(markPrice)}</strong>
            </div>
            {type === 'limit' ? (
                <LabeledCompactInput label={<Trans>Price(USDC)</Trans>} value={price} onChange={onPriceChange}>
                    {midPrice ? (
                        <button type="button" className="text-highlight" onClick={onUseMid}>
                            <Trans>Mid</Trans>
                        </button>
                    ) : null}
                </LabeledCompactInput>
            ) : null}
            <div className="space-y-1">
                <LabeledCompactInput
                    label={<Trans>Amount({coinDisplayName})</Trans>}
                    value={amount}
                    onChange={onAmountChange}
                >
                    <span className="text-xs font-medium text-second">{coinDisplayName}</span>
                </LabeledCompactInput>
                <PositionSizeSlider value={amountRatio} onChange={onRatioChange} />
            </div>
            <MetaValueRow
                label={<Trans>Size</Trans>}
                value={`${formatPerpsValue(positionSize, 8)} ${coinDisplayName}`}
            />
            <MetaValueRow
                label={<Trans>Est. Closed PnL</Trans>}
                value={estimatedPnl ? `${estimatedPnl.gt(0) ? '+' : ''}${estimatedPnl.toFixed(2)} USDC` : '-- USDC'}
                valueClassName={estimatedPnl ? (pnlIsNegative ? 'text-danger' : 'text-success') : undefined}
            />
            <div className="grid grid-cols-2 gap-4">
                <button
                    type="button"
                    className="h-12 rounded-full border border-main text-sm font-bold"
                    onClick={onCancel}
                >
                    <Trans>Cancel</Trans>
                </button>
                <button
                    type="button"
                    disabled={disabled}
                    className="h-12 rounded-full bg-main text-base font-bold text-primaryBottom disabled:opacity-40"
                    onClick={onConfirm}
                >
                    {pending ? <Trans>Submitting…</Trans> : <Trans>Close</Trans>}
                </button>
            </div>
        </PerpsDrawerFrame>
    );
}

function LabeledCompactInput({
    label,
    value,
    onChange,
    children,
}: {
    label: React.ReactNode;
    value: string;
    onChange(value: string): void;
    children?: React.ReactNode;
}) {
    return (
        <label className="flex items-center justify-between gap-2 text-[13px] font-medium leading-[17px] text-second">
            <span>{label}</span>
            <span className="flex h-10 w-[203px] items-center gap-2 rounded-lg border border-secondaryLine px-2 text-sm leading-[18px] text-main focus-within:border-highlight">
                <input
                    value={value}
                    inputMode="decimal"
                    className="min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 shadow-none outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none"
                    onChange={(event) => onChange(event.target.value)}
                />
                {children}
            </span>
        </label>
    );
}

function MetaValueRow({
    label,
    value,
    valueClassName,
}: {
    label: React.ReactNode;
    value: React.ReactNode;
    valueClassName?: string;
}) {
    return (
        <div className="flex items-center justify-between text-[13px] font-medium leading-[17px] text-second">
            <span>{label}</span>
            <span className={cn('text-sm leading-[18px] text-main', valueClassName)}>{value}</span>
        </div>
    );
}

type TpslOrder = FrontendOpenOrdersResponse[number];

function TpslDrawer({
    coin,
    entryPrice,
    markPrice,
    liquidationPrice,
    positionSize,
    side,
    existingTp,
    existingSl,
    tpPrice,
    slPrice,
    tpGain,
    slGain,
    tpGainMethod,
    slGainMethod,
    pending,
    canSubmit,
    onTpPriceChange,
    onSlPriceChange,
    onTpGainChange,
    onSlGainChange,
    onToggleTpGainMethod,
    onToggleSlGainMethod,
    onCancelTp,
    onCancelSl,
    onClose,
    onConfirm,
}: {
    coin: string;
    entryPrice: string;
    markPrice?: string;
    liquidationPrice: string | null;
    positionSize: string;
    side: 'long' | 'short';
    existingTp?: TpslOrder;
    existingSl?: TpslOrder;
    tpPrice: string;
    slPrice: string;
    tpGain: string;
    slGain: string;
    tpGainMethod: ComputeMethod;
    slGainMethod: ComputeMethod;
    pending: boolean;
    canSubmit: boolean;
    onTpPriceChange(value: string): void;
    onSlPriceChange(value: string): void;
    onTpGainChange(value: string): void;
    onSlGainChange(value: string): void;
    onToggleTpGainMethod(): void;
    onToggleSlGainMethod(): void;
    onCancelTp(): void;
    onCancelSl(): void;
    onClose(): void;
    onConfirm(): void;
}) {
    const coinDisplayName = toPerpsCoinDisplayName(coin);
    return (
        <PerpsDrawerFrame title={<Trans>TP/SL</Trans>} onClose={onClose}>
            <div className="space-y-2 text-xs font-medium leading-[14px]">
                <MetaValueRow label={<Trans>Symbol</Trans>} value={`${coinDisplayName}USDC`} />
                <MetaValueRow label={<Trans>Entry Price(USDC)</Trans>} value={formatPerpsValue(entryPrice)} />
                <MetaValueRow label={<Trans>Mark Price(USDC)</Trans>} value={formatPerpsValue(markPrice)} />
                <MetaValueRow label={<Trans>Est. Liq. Price(USDC)</Trans>} value={formatPerpsValue(liquidationPrice)} />
            </div>
            {existingTp ? (
                <ExistingTpslRow
                    label={<Trans>Take profit</Trans>}
                    order={existingTp}
                    entryPrice={entryPrice}
                    positionSize={positionSize}
                    side={side}
                    disabled={pending}
                    onCancel={onCancelTp}
                />
            ) : (
                <TpslInputRow
                    pricePlaceholder="TP Price"
                    percentPlaceholder="Gain"
                    sign="+"
                    price={tpPrice}
                    gain={tpGain}
                    gainMethod={tpGainMethod}
                    onPriceChange={onTpPriceChange}
                    onGainChange={onTpGainChange}
                    onToggleGainMethod={onToggleTpGainMethod}
                />
            )}
            {existingSl ? (
                <ExistingTpslRow
                    label={<Trans>Stop loss</Trans>}
                    order={existingSl}
                    entryPrice={entryPrice}
                    positionSize={positionSize}
                    side={side}
                    disabled={pending}
                    onCancel={onCancelSl}
                />
            ) : (
                <TpslInputRow
                    pricePlaceholder="SL Price"
                    percentPlaceholder="Loss"
                    sign="-"
                    price={slPrice}
                    gain={slGain}
                    gainMethod={slGainMethod}
                    onPriceChange={onSlPriceChange}
                    onGainChange={onSlGainChange}
                    onToggleGainMethod={onToggleSlGainMethod}
                />
            )}
            <button
                type="button"
                disabled={!canSubmit || pending}
                className="h-12 w-full rounded-full bg-main text-base font-bold leading-6 text-primaryBottom disabled:opacity-40"
                onClick={onConfirm}
            >
                {pending ? <Trans>Submitting…</Trans> : <Trans>Confirm</Trans>}
            </button>
        </PerpsDrawerFrame>
    );
}

function ExistingTpslRow({
    label,
    order,
    entryPrice,
    positionSize,
    side,
    disabled,
    onCancel,
}: {
    label: React.ReactNode;
    order: TpslOrder;
    entryPrice: string;
    positionSize: string;
    side: 'long' | 'short';
    disabled: boolean;
    onCancel(): void;
}) {
    const expectedPnl = computeTpslExpectedPnlUsd({
        entryPx: entryPrice,
        exitPx: order.triggerPx,
        positionSizeAbs: positionSize,
        side,
    });
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-third">{label}</span>
                <div className="flex items-center gap-3">
                    <strong className="text-sm">{formatPerpsValue(order.triggerPx)}</strong>
                    <button
                        type="button"
                        disabled={disabled}
                        className="text-sm font-semibold text-highlight disabled:opacity-40"
                        onClick={onCancel}
                    >
                        <Trans>Cancel</Trans>
                    </button>
                </div>
            </div>
            {expectedPnl ? (
                <p className={cn('text-right text-xs', expectedPnl.isNegative ? 'text-danger' : 'text-success')}>
                    {expectedPnl.isNegative ? '-' : '+'}${expectedPnl.amountText}
                </p>
            ) : null}
        </div>
    );
}

function TpslInputRow({
    pricePlaceholder,
    percentPlaceholder,
    sign,
    price,
    gain,
    gainMethod,
    onPriceChange,
    onGainChange,
    onToggleGainMethod,
}: {
    pricePlaceholder: string;
    percentPlaceholder: string;
    sign: '+' | '-';
    price: string;
    gain: string;
    gainMethod: ComputeMethod;
    onPriceChange(value: string): void;
    onGainChange(value: string): void;
    onToggleGainMethod(): void;
}) {
    const inputClassName =
        'min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-sm font-medium leading-[18px] text-main shadow-none outline-none ring-0 placeholder:text-third focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none';
    return (
        <div className="grid grid-cols-2 gap-2">
            <label className="flex h-8 items-center rounded-md border border-secondaryLine px-2 focus-within:border-highlight">
                <input
                    value={price}
                    inputMode="decimal"
                    placeholder={pricePlaceholder}
                    className={inputClassName}
                    onChange={(event) => onPriceChange(event.target.value)}
                />
            </label>
            <label className="flex h-8 items-center gap-1 rounded-md border border-secondaryLine px-2 focus-within:border-highlight">
                <span className="text-sm text-third">{sign}</span>
                <input
                    value={gain}
                    inputMode="decimal"
                    placeholder={percentPlaceholder}
                    className={cn(inputClassName, 'text-right')}
                    onChange={(event) => onGainChange(event.target.value)}
                />
                <button
                    type="button"
                    aria-label={gainMethod === 'ratio' ? 'Switch to USDC' : 'Switch to percentage'}
                    className="flex shrink-0 items-center gap-0.5 text-sm"
                    onClick={onToggleGainMethod}
                >
                    {gainMethod === 'ratio' ? '%' : '$'}
                    <ArrowLeftRight className="size-3 text-third" />
                </button>
            </label>
        </div>
    );
}

function ActionInput({
    label,
    value,
    onChange,
    suffix,
    placeholder = '0',
}: {
    label: React.ReactNode;
    value: string;
    onChange(value: string): void;
    suffix: string;
    placeholder?: string;
}) {
    return (
        <label className="block">
            <span className="mb-1 block text-sm font-semibold">{label}</span>
            <div className="flex h-12 items-center rounded-lg border border-secondaryLine px-3 focus-within:border-highlight">
                <input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    inputMode="decimal"
                    placeholder={placeholder}
                    className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none"
                />
                <span className="text-sm font-semibold">{suffix}</span>
            </div>
        </label>
    );
}
