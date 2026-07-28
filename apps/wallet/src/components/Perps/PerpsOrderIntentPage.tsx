import { PRIVY_CONNECTOR_ID } from '@dimensiondev/constants/static';
import {
    buildPerpsOrderRequest,
    type ComputeMethod,
    formatPrice,
    getDefaultLeverage,
    isOpenPositionMarginError,
    parseMinOrderValueError,
    type PerpsWalletClient,
    resolveValidatedTpSlSubmitPrice,
    validatePerpsPriceInput,
} from '@dimensiondev/perps-core';
import { type PerpsAddress, usePerpsClient, usePerpsComputedAccountValue } from '@dimensiondev/perps-react';
import { useNavigate } from '@dimensiondev/ssr';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { ArrowLeftRight, Check, ChevronDown, Minus, Plus, PlusCircle, Star, X } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useConnectors, useWalletClient } from 'wagmi';

import { calculateOrderLiquidationPrice, resolveEstimatedFillPrice } from '@/components/Perps/orderLiquidationPrice.js';
import { toPerpsCoinDisplayName, toPerpsMarketDisplayName } from '@/components/Perps/perpsCoin.js';
import { resolvePerpsPriceInput } from '@/components/Perps/resolvePerpsPriceInput.js';
import { usePerpsAccountValueStream } from '@/components/Perps/usePerpsAccountValueStream.js';
import { usePerpsMarketData } from '@/components/Perps/usePerpsMarketData.js';
import { useTpSlField } from '@/components/Perps/useTpSlField.js';
import { Drawer, DrawerContent } from '@/components/ui/drawer.js';
import { publishCurrentPerpsMutation } from '@/helpers/perpsMutation.js';
import { withSkipPinCodeCheck } from '@/helpers/withSkipPinCodeCheck.js';
import { useCachedEvmAddress } from '@/hooks/useCachedWalletAddresses.js';
import { useIsPerpsBlocked } from '@/hooks/useGeoblock.js';
import { cn } from '@/lib/utils.js';

interface Props {
    coin: string;
    direction: 'buy' | 'sell';
    orderType?: 'market' | 'limit';
}

type MarginMode = 'cross' | 'isolated';
type Sheet = 'margin' | 'leverage' | null;

const DEFAULT_SLIPPAGE = '0.08';

function formatNumber(value: BigNumber.Value | undefined, maximumFractionDigits = 2) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '--';
    return number.toLocaleString(undefined, { maximumFractionDigits });
}

export const PerpsOrderIntentPage = memo(function PerpsOrderIntentPage({
    coin,
    direction: initialDirection,
    orderType: initialOrderType = 'market',
}: Props) {
    const client = usePerpsClient();
    const navigate = useNavigate();
    const connectors = useConnectors();
    const address = useCachedEvmAddress();
    const perpsAddress = address as PerpsAddress | undefined;
    usePerpsAccountValueStream(perpsAddress);
    const computedAccount = usePerpsComputedAccountValue(perpsAddress);
    const { data: walletClient } = useWalletClient({
        connector: connectors.find((connector) => connector.id === PRIVY_CONNECTOR_ID),
    });
    const { isBlocked, isLoading: isGeoblockLoading } = useIsPerpsBlocked();
    const { activeAssetData, coinInfo, isMarketDataFresh, rawCoin } = usePerpsMarketData(coin, address ?? undefined);
    const coinDisplayName = toPerpsCoinDisplayName(rawCoin);
    const [direction, setDirection] = useState(initialDirection);
    const [marginMode, setMarginMode] = useState<MarginMode>('isolated');
    const [leverage, setLeverage] = useState(() => getDefaultLeverage(coinInfo?.maxLeverage));
    const [orderType, setOrderType] = useState(initialOrderType);
    const [sizeUnit, setSizeUnit] = useState<'USDC' | 'coin'>('USDC');
    const [showUnitMenu, setShowUnitMenu] = useState(false);
    const [sizeInput, setSizeInput] = useState('');
    const [sizePercentage, setSizePercentage] = useState(0);
    const [limitPrice, setLimitPrice] = useState('');
    const [reduceOnly, setReduceOnly] = useState(false);
    const [hasTpSl, setHasTpSl] = useState(false);
    const [sheet, setSheet] = useState<Sheet>(null);
    const handleClose = () => navigate('/perps', { replace: true });

    useEffect(() => {
        setDirection(initialDirection);
    }, [initialDirection]);

    useEffect(() => {
        setOrderType(initialOrderType);
    }, [initialOrderType]);

    const markPrice = coinInfo?.assetCtx?.markPx ?? activeAssetData?.markPx;
    const midPrice = coinInfo?.assetCtx?.midPx ?? markPrice;
    const priceChange = coinInfo?.priceDiffRatio;
    const maxLeverage = coinInfo?.maxLeverage ?? 1;
    const available = activeAssetData?.availableToTrade?.[0];
    const orderPrice = orderType === 'market' ? markPrice : limitPrice;
    const estimatedFillPrice =
        orderType === 'limit' ? resolveEstimatedFillPrice({ direction, limitPrice, markPrice }) : orderPrice;
    const size = useMemo(() => {
        const input = new BigNumber(sizeInput || '0');
        const price = new BigNumber(orderPrice || '0');
        if (!input.isFinite() || input.lte(0) || !price.isFinite() || price.lte(0)) return '0';
        const amount = sizeUnit === 'USDC' ? input.dividedBy(price) : input;
        return amount.toFixed(coinInfo?.szDecimals ?? 4, BigNumber.ROUND_DOWN);
    }, [coinInfo?.szDecimals, orderPrice, sizeInput, sizeUnit]);
    const tpSlContext = {
        isLong: direction === 'buy',
        entryPrice: orderPrice || '',
        leverage,
        size,
        szDecimals: coinInfo?.szDecimals ?? 4,
    };
    const tpField = useTpSlField({ ...tpSlContext, isTp: true });
    const slField = useTpSlField({ ...tpSlContext, isTp: false });
    const notional = useMemo(() => new BigNumber(size || '0').multipliedBy(orderPrice || '0'), [orderPrice, size]);
    const marginRequired = notional.dividedBy(leverage || 1);
    const canCalculateOrderSummary =
        new BigNumber(size || '0').gt(0) &&
        new BigNumber(orderPrice || '0').gt(0) &&
        Number.isFinite(leverage) &&
        leverage > 0;
    const estimatedLiquidationPrice = useMemo(() => {
        if (!canCalculateOrderSummary || maxLeverage <= 0) return null;
        const value = calculateOrderLiquidationPrice({
            isLong: direction === 'buy',
            isIsolated: marginMode === 'isolated',
            entryPrice: estimatedFillPrice!,
            size,
            leverage,
            maxLeverage,
            crossAccountValue: computedAccount.accountValue,
        });
        return value ? formatNumber(value, 2) : null;
    }, [
        canCalculateOrderSummary,
        computedAccount.accountValue,
        direction,
        estimatedFillPrice,
        leverage,
        marginMode,
        maxLeverage,
        size,
    ]);
    const hasAvailableBalance = available !== undefined && new BigNumber(available).gt(0);
    const hasInsufficientMargin = available !== undefined && marginRequired.gt(available);
    const maxPositionAtCurrentLeverage = useMemo(() => {
        const maxSize = activeAssetData?.maxTradeSzs?.[direction === 'buy' ? 0 : 1];
        const value = new BigNumber(maxSize || '0').multipliedBy(markPrice || '0');
        return value.isFinite() && value.gt(0) ? formatNumber(value, 0) : '--';
    }, [activeAssetData?.maxTradeSzs, direction, markPrice]);

    useEffect(() => {
        if (!coinInfo) return;
        if (!activeAssetData) {
            setLeverage(getDefaultLeverage(coinInfo.maxLeverage));
            return;
        }
        setMarginMode(activeAssetData.leverage.type);
        setLeverage(Math.min(activeAssetData.leverage.value, coinInfo.maxLeverage));
    }, [activeAssetData, coinInfo]);

    useEffect(() => {
        if (orderType !== 'limit' || !midPrice || !coinInfo) return;
        if (!limitPrice || !validatePerpsPriceInput(limitPrice, coinInfo.szDecimals)) {
            setLimitPrice(formatPrice(midPrice, coinInfo.szDecimals));
        }
    }, [coinInfo, limitPrice, midPrice, orderType]);

    const settingMutation = useMutation({
        mutationFn: ({ mode, nextLeverage }: { mode: MarginMode; nextLeverage: number }) =>
            withSkipPinCodeCheck(async () => {
                if (!walletClient || !address || !coinInfo) throw new Error('Wallet is unavailable.');
                const exchange = client.createExchangeClient(walletClient as PerpsWalletClient);
                await exchange.updateLeverage({
                    asset: coinInfo.index,
                    isCross: mode === 'cross',
                    leverage: nextLeverage,
                });
                return { mode, nextLeverage };
            }),
        onSuccess({ mode, nextLeverage }) {
            setMarginMode(mode);
            setLeverage(nextLeverage);
            setSheet(null);
            toast.success(<Trans>Position settings updated.</Trans>);
        },
        onError(error) {
            const rawMessage = error instanceof Error ? error.message : undefined;
            toast.error(
                isOpenPositionMarginError(rawMessage) ? (
                    <Trans>Margin mode cannot be changed while a position is open.</Trans>
                ) : (
                    <Trans>Failed to update position settings.</Trans>
                ),
                rawMessage ? { description: rawMessage } : undefined,
            );
        },
    });

    const orderMutation = useMutation({
        mutationFn: () =>
            withSkipPinCodeCheck(async () => {
                if (!walletClient || !address) throw new Error('Wallet is unavailable.');
                if (isBlocked) throw new Error('Perpetuals are unavailable in this region.');
                if (!coinInfo || !orderPrice || new BigNumber(orderPrice).lte(0)) {
                    throw new Error('Market price is unavailable.');
                }
                if (orderType === 'limit' && !validatePerpsPriceInput(orderPrice, coinInfo.szDecimals)) {
                    throw new Error('Enter a valid limit price.');
                }
                if (orderType === 'market' && !isMarketDataFresh()) {
                    throw new Error('The market price is stale. Check your connection and try again.');
                }
                if (new BigNumber(size).lte(0)) throw new Error('Enter an order size.');
                if (!reduceOnly && hasInsufficientMargin) throw new Error('Insufficient margin.');

                const isLong = direction === 'buy';
                const submitOrderPrice =
                    orderType === 'limit' ? formatPrice(orderPrice, coinInfo.szDecimals) : orderPrice;
                if (
                    (tpField.anchor === 'price' &&
                        tpField.price &&
                        !validatePerpsPriceInput(tpField.price, coinInfo.szDecimals)) ||
                    (slField.anchor === 'price' &&
                        slField.price &&
                        !validatePerpsPriceInput(slField.price, coinInfo.szDecimals))
                ) {
                    throw new Error('Enter a valid take-profit or stop-loss price.');
                }
                const tpResolution = resolveValidatedTpSlSubmitPrice({
                    anchor: tpField.anchor,
                    gain: hasTpSl ? tpField.gain : '',
                    method: tpField.method,
                    priceInput: hasTpSl ? tpField.price : '',
                    entryPrice: submitOrderPrice,
                    markPrice,
                    isLong,
                    isTp: true,
                    leverage,
                    size,
                    szDecimals: coinInfo.szDecimals,
                });
                const slResolution = resolveValidatedTpSlSubmitPrice({
                    anchor: slField.anchor,
                    gain: hasTpSl ? slField.gain : '',
                    method: slField.method,
                    priceInput: hasTpSl ? slField.price : '',
                    entryPrice: submitOrderPrice,
                    markPrice,
                    isLong,
                    isTp: false,
                    leverage,
                    size,
                    szDecimals: coinInfo.szDecimals,
                });
                if (tpResolution.status === 'invalid' || slResolution.status === 'invalid') {
                    throw new Error('Invalid take-profit or stop-loss price.');
                }

                const exchange = client.createExchangeClient(walletClient as PerpsWalletClient);
                await exchange.order(
                    buildPerpsOrderRequest({
                        asset: coinInfo.index,
                        isLong,
                        price: submitOrderPrice,
                        size,
                        szDecimals: coinInfo.szDecimals,
                        orderType,
                        safeType: hasTpSl ? 'tpSl' : reduceOnly ? 'reduceOnly' : 'none',
                        tpPrice: tpResolution.status === 'valid' ? tpResolution.price : null,
                        slPrice: slResolution.status === 'valid' ? slResolution.price : null,
                        slippage: DEFAULT_SLIPPAGE,
                    }),
                );
            }),
        async onSuccess() {
            setSizeInput('');
            setSizePercentage(0);
            await publishCurrentPerpsMutation('success');
            toast.success(<Trans>Order submitted.</Trans>);
            handleClose();
        },
        onError(error) {
            const rawMessage = error instanceof Error ? error.message : '';
            const minimumOrderValue = parseMinOrderValueError(rawMessage);
            const message = minimumOrderValue ? `Minimum order value is ${minimumOrderValue} USDC.` : rawMessage;
            void publishCurrentPerpsMutation('failed', message || 'Order failed.');
            toast.error(<Trans>Order failed.</Trans>, { description: message || undefined });
        },
    });

    const handlePercentage = (percentage: number) => {
        setSizePercentage(percentage);
        const enlargedBalance = new BigNumber(available || '0')
            .multipliedBy(leverage)
            .multipliedBy(percentage)
            .dividedBy(100);
        if (sizeUnit === 'USDC') setSizeInput(enlargedBalance.toFixed(2, BigNumber.ROUND_DOWN));
        else
            setSizeInput(
                enlargedBalance.dividedBy(orderPrice || '1').toFixed(coinInfo?.szDecimals ?? 4, BigNumber.ROUND_DOWN),
            );
    };

    const handleSizeInput = (value: string) => {
        setSizeInput(value);
        const input = new BigNumber(value || '0');
        const enlargedBalance = new BigNumber(available || '0').multipliedBy(leverage);
        const inputNotional = sizeUnit === 'USDC' ? input : input.multipliedBy(orderPrice || '0');
        const percentage = inputNotional.dividedBy(enlargedBalance).multipliedBy(100);
        setSizePercentage(percentage.isFinite() ? Math.min(100, Math.max(0, percentage.toNumber())) : 0);
    };

    const selectSizeUnit = (unit: 'USDC' | 'coin') => {
        if (unit === sizeUnit) {
            setShowUnitMenu(false);
            return;
        }
        const currentSize = new BigNumber(size || '0');
        setSizeUnit(unit);
        setSizeInput(
            currentSize.gt(0)
                ? unit === 'coin'
                    ? currentSize.toFixed(coinInfo?.szDecimals ?? 4, BigNumber.ROUND_DOWN)
                    : currentSize.multipliedBy(orderPrice || '0').toFixed(2, BigNumber.ROUND_DOWN)
                : '',
        );
        setShowUnitMenu(false);
    };

    const submitDisabled =
        orderMutation.isPending ||
        isGeoblockLoading ||
        isBlocked ||
        !coinInfo ||
        !orderPrice ||
        new BigNumber(size).lte(0) ||
        (!reduceOnly && (available === undefined || hasInsufficientMargin));

    return (
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-primaryBottom text-main">
            <header className="flex shrink-0 items-start gap-4 p-4">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <button
                        type="button"
                        aria-label="Favorite market"
                        className="flex size-[30px] items-center justify-center"
                    >
                        <Star className="size-[30px] stroke-[1.5]" />
                    </button>
                    <div className="flex h-10 flex-col justify-center">
                        <div className="flex h-5 items-center gap-0.5">
                            <h1 className="font-[Poppins] text-lg font-semibold leading-none">
                                {toPerpsMarketDisplayName(rawCoin)}
                            </h1>
                            <span className="rounded-full bg-lightBg px-1.5 py-0.5 text-xs font-medium text-third">
                                {maxLeverage}x
                            </span>
                        </div>
                        <p className="text-[13px] font-medium leading-[17px] text-second">
                            {formatNumber(markPrice)}{' '}
                            <span className={cn(Number(priceChange) >= 0 ? 'text-success' : 'text-danger')}>
                                {priceChange === undefined
                                    ? '--'
                                    : `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`}
                            </span>
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    aria-label="Close order form"
                    className="flex size-6 items-center justify-center"
                    onClick={handleClose}
                >
                    <X className="size-6 stroke-[1.5]" />
                </button>
            </header>

            <main className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-4 [&>*]:shrink-0">
                <div className="grid grid-cols-3 gap-1.5">
                    <ControlButton onClick={() => setSheet('margin')}>
                        {marginMode === 'cross' ? <Trans>Cross</Trans> : <Trans>Isolated</Trans>}
                    </ControlButton>
                    <ControlButton onClick={() => setSheet('leverage')}>{leverage}x</ControlButton>
                    <ControlButton
                        icon="switch"
                        onClick={() => setOrderType((current) => (current === 'market' ? 'limit' : 'market'))}
                    >
                        {orderType === 'market' ? <Trans>Market</Trans> : <Trans>Limit</Trans>}
                    </ControlButton>
                </div>

                <div
                    role="tablist"
                    aria-label="Order direction"
                    className="mt-3 flex rounded-md border border-secondaryLine p-1"
                >
                    <DirectionTab selected={direction === 'buy'} direction="buy" onClick={() => setDirection('buy')}>
                        <Trans>Buy / Long</Trans>
                    </DirectionTab>
                    <DirectionTab selected={direction === 'sell'} direction="sell" onClick={() => setDirection('sell')}>
                        <Trans>Sell / Short</Trans>
                    </DirectionTab>
                </div>

                {orderType === 'limit' ? (
                    <label className="mt-3 flex h-10 items-center rounded-md border border-secondaryLine px-2 focus-within:border-highlight">
                        <span className="sr-only">
                            <Trans>Limit price</Trans>
                        </span>
                        <input
                            value={limitPrice}
                            onChange={(event) => {
                                const value = resolvePerpsPriceInput(event.target.value, coinInfo?.szDecimals ?? 4);
                                if (value !== null) setLimitPrice(value);
                            }}
                            onBlur={() => {
                                if (limitPrice && coinInfo) setLimitPrice(formatPrice(limitPrice, coinInfo.szDecimals));
                            }}
                            inputMode="decimal"
                            placeholder="Price"
                            className="min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-sm text-main shadow-none outline-none ring-0 placeholder:text-third focus:border-0 focus:outline-none focus:ring-0"
                        />
                        <span className="shrink-0 text-xs font-medium">USDC</span>
                        <button
                            type="button"
                            className="ml-1 shrink-0 text-sm font-medium text-highlight"
                            onClick={() => {
                                if (midPrice && coinInfo) setLimitPrice(formatPrice(midPrice, coinInfo.szDecimals));
                            }}
                        >
                            <Trans>Mid</Trans>
                        </button>
                    </label>
                ) : null}

                <label className="relative mt-3 flex h-10 items-center rounded-md border border-secondaryLine px-2 focus-within:border-highlight">
                    <span className="sr-only">
                        <Trans>Size</Trans>
                    </span>
                    <input
                        value={sizeInput}
                        onChange={(event) => handleSizeInput(event.target.value)}
                        inputMode="decimal"
                        placeholder="Size"
                        className="min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-sm text-main shadow-none outline-none ring-0 placeholder:text-third focus:border-0 focus:outline-none focus:ring-0"
                    />
                    <button
                        type="button"
                        className="flex items-center gap-1 text-xs font-medium"
                        onClick={() => setShowUnitMenu((value) => !value)}
                    >
                        {sizeUnit === 'USDC' ? 'USDC' : coinDisplayName}
                        <ChevronDown className="size-3.5" />
                    </button>
                    {showUnitMenu ? (
                        <div className="absolute right-0 top-11 z-30 w-16 overflow-hidden rounded-md bg-primaryBottom py-1 shadow-[0_8px_64px_rgba(0,0,0,0.1)] dark:shadow-none">
                            <button
                                type="button"
                                className="h-9 w-full text-sm font-semibold"
                                onClick={() => selectSizeUnit('USDC')}
                            >
                                USDC
                            </button>
                            <button
                                type="button"
                                className="h-9 w-full text-sm font-semibold"
                                onClick={() => selectSizeUnit('coin')}
                            >
                                {coinDisplayName}
                            </button>
                        </div>
                    ) : null}
                </label>

                <SizeSlider value={sizePercentage} onChange={handlePercentage} />

                <div className="mt-2 flex h-6 items-center justify-between text-sm">
                    <span className="text-second">
                        <Trans>Available</Trans>
                    </span>
                    <button
                        type="button"
                        className="flex items-center gap-1 font-medium"
                        onClick={() => navigate('/perps/deposit')}
                    >
                        {available === undefined ? '--' : `$${formatNumber(available)}`}{' '}
                        <PlusCircle className="size-3 text-highlight" />
                    </button>
                </div>

                <div className="mt-4 space-y-1">
                    <CheckboxRow
                        checked={reduceOnly}
                        onChange={(checked) => {
                            setReduceOnly(checked);
                            if (checked) setHasTpSl(false);
                        }}
                    >
                        <Trans>Reduce Only</Trans>
                    </CheckboxRow>
                    <CheckboxRow
                        checked={hasTpSl}
                        onChange={(checked) => {
                            setHasTpSl(checked);
                            if (checked) setReduceOnly(false);
                        }}
                    >
                        <Trans>Take Profit / Stop Loss</Trans>
                    </CheckboxRow>
                </div>

                {hasTpSl ? (
                    <div className="mt-3 space-y-1.5">
                        <div className="grid grid-cols-2 gap-2">
                            <CompactPriceField
                                placeholder="TP Price"
                                value={tpField.priceDisplay}
                                szDecimals={coinInfo?.szDecimals ?? 4}
                                onChange={tpField.changePrice}
                            />
                            <GainField
                                placeholder="Gain"
                                value={tpField.gainDisplay}
                                method={tpField.method}
                                onChange={tpField.changeGain}
                                onToggleMethod={tpField.toggleMethod}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <CompactPriceField
                                placeholder="SL Price"
                                value={slField.priceDisplay}
                                szDecimals={coinInfo?.szDecimals ?? 4}
                                onChange={slField.changePrice}
                            />
                            <GainField
                                placeholder="Loss"
                                value={slField.gainDisplay}
                                method={slField.method}
                                onChange={slField.changeGain}
                                onToggleMethod={slField.toggleMethod}
                            />
                        </div>
                    </div>
                ) : null}

                <div className="mt-auto space-y-2 pb-4 pt-8 text-sm">
                    <SummaryRow
                        label={<Trans>Est. Liq. price</Trans>}
                        value={estimatedLiquidationPrice ? `$${estimatedLiquidationPrice}` : 'N/A'}
                    />
                    <SummaryRow
                        label={<Trans>Cost</Trans>}
                        value={canCalculateOrderSummary ? `$${formatNumber(notional, 2)}` : '-'}
                    />
                    <SummaryRow
                        label={<Trans>Margin Required</Trans>}
                        value={canCalculateOrderSummary ? `$${formatNumber(marginRequired, 2)}` : '-'}
                    />
                    {isBlocked ? (
                        <p role="alert" className="rounded-md bg-dangerBg p-2 text-xs text-danger">
                            <Trans>This feature is currently unavailable in your region.</Trans>
                        </p>
                    ) : null}
                </div>
            </main>

            <footer className="shrink-0 bg-primaryBottom px-4 pb-4 pt-2">
                <button
                    type="button"
                    disabled={submitDisabled}
                    className={cn(
                        'h-12 w-full rounded-full text-base font-bold text-white disabled:opacity-40',
                        direction === 'buy' ? 'bg-success' : 'bg-danger',
                    )}
                    onClick={() => orderMutation.mutate()}
                >
                    {orderMutation.isPending ? (
                        <Trans>Submitting…</Trans>
                    ) : !hasAvailableBalance && !reduceOnly ? (
                        <Trans>Insufficient Balance</Trans>
                    ) : hasInsufficientMargin && !reduceOnly ? (
                        <Trans>Insufficient Margin</Trans>
                    ) : (
                        <Trans>Place Order</Trans>
                    )}
                </button>
            </footer>

            <OrderControlDrawer
                sheet={sheet}
                setSheet={setSheet}
                marginMode={marginMode}
                leverage={leverage}
                maxLeverage={maxLeverage}
                loading={settingMutation.isPending}
                maxPosition={maxPositionAtCurrentLeverage}
                rawCoin={rawCoin}
                onConfirmMargin={(mode) => settingMutation.mutate({ mode, nextLeverage: leverage })}
                onConfirmLeverage={(nextLeverage) => settingMutation.mutate({ mode: marginMode, nextLeverage })}
            />
        </div>
    );
});

function ControlButton({
    children,
    icon = 'chevron',
    onClick,
}: {
    children: React.ReactNode;
    icon?: 'chevron' | 'switch';
    onClick(): void;
}) {
    return (
        <button
            type="button"
            className="flex h-10 items-center justify-between rounded-md border border-secondaryLine px-2.5 text-xs font-medium"
            onClick={onClick}
        >
            {children}
            {icon === 'switch' ? (
                <ArrowLeftRight className="size-3.5 text-second" />
            ) : (
                <ChevronDown className="size-3.5" />
            )}
        </button>
    );
}

function DirectionTab({
    children,
    selected,
    direction,
    onClick,
}: {
    children: React.ReactNode;
    selected: boolean;
    direction: 'buy' | 'sell';
    onClick(): void;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(
                'flex-1 rounded px-3 py-1.5 text-sm font-semibold',
                selected ? (direction === 'buy' ? 'bg-success text-white' : 'bg-danger text-white') : 'text-second',
            )}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

function SizeSlider({ value, onChange }: { value: number; onChange(value: number): void }) {
    const steps = [0, 25, 50, 75, 100];
    return (
        <div className="relative mt-3 h-6" aria-label="Order size percentage">
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
                        step < value ? 'border-main' : 'border-third',
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
                aria-label="Order size percentage"
                className="absolute inset-0 z-20 size-full cursor-pointer opacity-0"
                onChange={(event) => onChange(Number(event.target.value))}
            />
        </div>
    );
}

function CheckboxRow({
    checked,
    children,
    onChange,
}: {
    checked: boolean;
    children: React.ReactNode;
    onChange(checked: boolean): void;
}) {
    return (
        <label className="flex h-6 items-center gap-1.5 text-sm font-medium">
            <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                className={cn(
                    'flex size-4 items-center justify-center rounded-[3px] border',
                    checked ? 'border-main bg-main text-primaryBottom' : 'border-third',
                )}
                onClick={() => onChange(!checked)}
            >
                {checked ? <Check className="size-3" /> : null}
            </button>
            {children}
        </label>
    );
}

function CompactPriceField({
    placeholder,
    value,
    szDecimals,
    onChange,
}: {
    placeholder: string;
    value: string;
    szDecimals: number;
    onChange(value: string): void;
}) {
    return (
        <label className="flex h-8 items-center rounded-md border border-secondaryLine px-2">
            <input
                value={value}
                onChange={(event) => {
                    const nextValue = resolvePerpsPriceInput(event.target.value, szDecimals);
                    if (nextValue !== null) onChange(nextValue);
                }}
                inputMode="decimal"
                placeholder={placeholder}
                className="min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-xs text-main shadow-none outline-none ring-0 placeholder:text-third focus:border-0 focus:outline-none focus:ring-0"
            />
            <span className="text-xs font-medium">$</span>
        </label>
    );
}

function GainField({
    placeholder,
    value,
    method,
    onChange,
    onToggleMethod,
}: {
    placeholder: string;
    value: string;
    method: ComputeMethod;
    onChange(value: string): void;
    onToggleMethod(): void;
}) {
    return (
        <label className="flex h-8 items-center rounded-md border border-secondaryLine px-2">
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                inputMode="decimal"
                placeholder={placeholder}
                className="min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-xs text-main shadow-none outline-none ring-0 placeholder:text-third focus:border-0 focus:outline-none focus:ring-0"
            />
            <button type="button" className="flex items-center gap-0.5 text-xs font-medium" onClick={onToggleMethod}>
                {method === 'usd' ? '$' : '%'} <ArrowLeftRight className="size-3 text-second" />
            </button>
        </label>
    );
}

function SummaryRow({ label, value }: { label: React.ReactNode; value: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-second">{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

interface OrderControlDrawerProps {
    sheet: Sheet;
    setSheet(value: Sheet): void;
    marginMode: MarginMode;
    leverage: number;
    maxLeverage: number;
    loading: boolean;
    maxPosition: string;
    rawCoin: string;
    onConfirmMargin(value: MarginMode): void;
    onConfirmLeverage(value: number): void;
}

function OrderControlDrawer(props: OrderControlDrawerProps) {
    return (
        <Drawer
            open={props.sheet !== null}
            onOpenChange={(open) => {
                if (!open) props.setSheet(null);
            }}
        >
            <DrawerContent
                className="mx-auto w-full max-w-[800px] rounded-t-[36px] border border-secondaryLine bg-primaryBottom text-main shadow-[0_16px_20px_rgba(0,0,0,0.1)] dark:shadow-none"
                bodyClassName="px-4 pb-4"
            >
                <SheetHandle />
                {props.sheet === 'margin' ? (
                    <MarginModeContent
                        current={props.marginMode}
                        loading={props.loading}
                        onConfirm={props.onConfirmMargin}
                    />
                ) : null}
                {props.sheet === 'leverage' ? (
                    <LeverageContent
                        current={props.leverage}
                        max={props.maxLeverage}
                        coin={toPerpsCoinDisplayName(props.rawCoin)}
                        loading={props.loading}
                        maxPosition={props.maxPosition}
                        onConfirm={props.onConfirmLeverage}
                    />
                ) : null}
            </DrawerContent>
        </Drawer>
    );
}

function SheetHandle() {
    return <div className="mx-auto mb-4 mt-2 h-1 w-10 rounded-full bg-third" />;
}

function MarginModeContent({
    current,
    loading,
    onConfirm,
}: {
    current: MarginMode;
    loading: boolean;
    onConfirm(value: MarginMode): void;
}) {
    const [selected, setSelected] = useState(current);
    useEffect(() => setSelected(current), [current]);
    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">
                <Trans>Margin Mode</Trans>
            </h2>
            <div className="space-y-3">
                <MarginOption
                    selected={selected === 'cross'}
                    title={<Trans>Cross</Trans>}
                    description={
                        <Trans>
                            All cross positions share the same cross margin as collateral. In the event of liquidation,
                            your cross margin balance and any remaining open positions under assets in this mode may be
                            forfeited.
                        </Trans>
                    }
                    onClick={() => setSelected('cross')}
                />
                <MarginOption
                    selected={selected === 'isolated'}
                    title={<Trans>Isolated</Trans>}
                    description={
                        <Trans>
                            Manage your risk on individual positions by restricting the amount of margin allocated to
                            each. If the margin ratio of an isolated position reaches 100%, the position will be
                            liquidated. Margin can be added or removed to individual positions in this mode.
                        </Trans>
                    }
                    onClick={() => setSelected('isolated')}
                />
            </div>
            <ConfirmButton loading={loading} onClick={() => onConfirm(selected)} />
        </div>
    );
}

function MarginOption({
    selected,
    title,
    description,
    onClick,
}: {
    selected: boolean;
    title: React.ReactNode;
    description: React.ReactNode;
    onClick(): void;
}) {
    return (
        <button type="button" className="w-full text-left" onClick={onClick}>
            <span className="flex items-center gap-1.5 text-base font-medium">
                <span
                    className={cn(
                        'flex size-5 items-center justify-center rounded-[4px] border',
                        selected ? 'border-main bg-main text-primaryBottom' : 'border-main',
                    )}
                >
                    {selected ? <Check className="size-3.5" /> : null}
                </span>
                {title}
            </span>
            <span className="mt-2 block text-[13px] font-medium leading-[17px] text-second">{description}</span>
        </button>
    );
}

function LeverageContent({
    current,
    max,
    coin,
    loading,
    maxPosition,
    onConfirm,
}: {
    current: number;
    max: number;
    coin: string;
    loading: boolean;
    maxPosition: string;
    onConfirm(value: number): void;
}) {
    const [value, setValue] = useState(current);
    useEffect(() => setValue(Math.min(current, max)), [current, max]);
    const clamp = (next: number) => Math.min(max, Math.max(1, next));
    return (
        <div className="flex min-h-[325px] flex-col gap-4">
            <h2 className="pt-3 text-xl font-[SF_Pro_Rounded] font-bold leading-6">
                <Trans>Adjust Leverage</Trans>
            </h2>
            <div className="flex items-center justify-between">
                <LeverageStepButton onClick={() => setValue((currentValue) => clamp(currentValue - 1))}>
                    <Minus className="size-6" />
                </LeverageStepButton>
                <strong className="font-[Poppins] text-[32px] font-semibold leading-10">{value}x</strong>
                <LeverageStepButton onClick={() => setValue((currentValue) => clamp(currentValue + 1))}>
                    <Plus className="size-6" />
                </LeverageStepButton>
            </div>
            <LeverageSlider value={value} min={1} max={max} onChange={(next) => setValue(clamp(next))} />
            <ul className="list-disc pl-[19.5px] text-[13px] font-medium leading-[17px] text-second">
                <li>
                    <Trans>
                        Control the leverage used for {coin} positions. The maximum leverage is {max}x.
                    </Trans>
                </li>
                <li>
                    <Trans>Maximum position at current leverage: {maxPosition} USDC.</Trans>
                </li>
                <li>
                    <Trans>Max position size decreases the higher your leverage.</Trans>
                </li>
            </ul>
            <div className="mt-auto">
                <ConfirmButton loading={loading} onClick={() => onConfirm(value)} />
            </div>
        </div>
    );
}

function LeverageStepButton({ children, onClick }: { children: React.ReactNode; onClick(): void }) {
    return (
        <button
            type="button"
            className="flex size-10 items-center justify-center rounded-lg bg-lightBg text-second"
            onClick={onClick}
        >
            {children}
        </button>
    );
}

function LeverageSlider({
    value,
    min,
    max,
    onChange,
}: {
    value: number;
    min: number;
    max: number;
    onChange(value: number): void;
}) {
    const ratio = max === min ? 0 : (value - min) / (max - min);
    return (
        <div className="relative h-[15px] py-[5px]">
            <div className="pointer-events-none absolute inset-x-0 top-[5px] h-1 rounded-full bg-[#5e69ff]/20" />
            <div
                className="pointer-events-none absolute left-0 top-[5px] h-1 rounded-full bg-[#5e69ff]"
                style={{ width: `${ratio * 100}%` }}
            />
            <span
                className="pointer-events-none absolute top-[7px] size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-secondaryLine bg-primaryBottom shadow-[0_2px_4px_rgba(94,105,255,0.36)]"
                style={{ left: `${ratio * 100}%` }}
            />
            <input
                type="range"
                min={min}
                max={max}
                step={1}
                value={value}
                aria-label="Leverage"
                className="absolute inset-x-0 -top-1 z-10 h-6 w-full cursor-pointer opacity-0"
                onChange={(event) => onChange(Number(event.target.value))}
            />
        </div>
    );
}

function ConfirmButton({ loading, onClick }: { loading: boolean; onClick(): void }) {
    return (
        <button
            type="button"
            disabled={loading}
            className="h-12 w-full rounded-full bg-main text-base font-bold text-primaryBottom disabled:opacity-40"
            onClick={onClick}
        >
            {loading ? <Trans>Confirming…</Trans> : <Trans>Confirm</Trans>}
        </button>
    );
}
