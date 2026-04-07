import { Trans } from '@lingui/react/macro';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { BetAmountStepper } from '@/components/Bet/BetAmountStepper.js';
import { BetLimitPriceCentsInput } from '@/components/Bet/BetLimitPriceCentsInput.js';
import { useSyncLimitPriceCents } from '@/components/Bet/useSyncLimitPriceCents.js';
import { Skeleton } from '@/components/Skeleton.js';
import { Button } from '@/components/ui/button.js';
import { formatPnlUSD } from '@/helpers/formatPnlUSD.js';
import { formatPriceToCents } from '@/helpers/formatPriceToCents.js';
import { formatTokenItemAmount } from '@/helpers/formatTokenItemAmount.js';
import { getLimitPriceCentsInputConfig } from '@/helpers/getLimitPriceCentsInputConfig.js';
import { normalizeBetInput } from '@/helpers/normalizeBetInput.js';
import { safeBigNumber } from '@/helpers/safeBigNumber.js';
import { cn } from '@/lib/utils.js';
import { getAvailableSharesByConditionIdQueryOptions } from '@/queries/firefly/getAvailableSharesByConditionIdQueryOptions.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getPolymarketToWinAmountQueryOptions } from '@/queries/firefly/getPolymarketToWinAmountQueryOptions.js';

interface SubmitMarketArgs {
    shares: number;
}
interface SubmitLimitArgs {
    shares: number;
    limitPrice: number;
}

const POLYMARKET_QUOTE_POLL_MS = 3000;

export function SellMarketForm({
    outcome,
    tokenId,
    conditionId,
    loading,
    onSubmit,
    submitDisabled,
}: {
    outcome: string;
    tokenId: string;
    conditionId: string;
    loading?: boolean;
    onSubmit: (args: SubmitMarketArgs) => Promise<unknown> | void;
    submitDisabled?: boolean;
}) {
    const form = useForm<{ shares: string }>({
        mode: 'onChange',
    });
    const { control } = form;
    const shares = form.watch('shares') ?? '';

    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const { data: availableShares = '0', isLoading: isLoadingAvailableShares } = useQuery({
        ...getAvailableSharesByConditionIdQueryOptions(account.proxyAddress, conditionId, tokenId),
    });

    const availableSharesBN = safeBigNumber(availableShares, 0);
    const sharesBN = safeBigNumber(shares, 0);

    const { data: toWin, isLoading: isLoadingToWin } = useQuery({
        ...getPolymarketToWinAmountQueryOptions('SELL', tokenId, sharesBN.toNumber()),
        enabled: sharesBN.gt(0),
        refetchInterval: sharesBN.gt(0) ? POLYMARKET_QUOTE_POLL_MS : false,
    });

    const isOverMax = sharesBN.gt(availableSharesBN);
    const canSubmit = sharesBN.gt(0) && !isOverMax;

    return (
        <div className="flex w-full flex-1 flex-col">
            <Controller
                control={control}
                name="shares"
                render={({ field }) => {
                    return (
                        <div className="flex w-full flex-1 flex-col items-center justify-center">
                            <BetAmountStepper
                                value={field.value}
                                onChange={(e) => field.onChange(normalizeBetInput(e.target.value, 'shares'))}
                                onDecrease={() => {
                                    const n = safeBigNumber(field.value, 0);
                                    field.onChange(
                                        normalizeBetInput(BigNumber.max(0, n.minus(1)).toString(), 'shares'),
                                    );
                                }}
                                onIncrease={() => {
                                    const n = safeBigNumber(field.value, 0);
                                    field.onChange(normalizeBetInput(BigNumber.max(0, n.plus(1)).toString(), 'shares'));
                                }}
                                decreaseDisabled={BigNumber(field.value || 0).lte(0)}
                                inputProps={{
                                    placeholder: '$0',
                                }}
                                inputClassName={cn({
                                    'text-danger': isOverMax,
                                })}
                            />
                            <Skeleton className="h-5 w-full max-w-[100px]" isLoading={isLoadingAvailableShares}>
                                <div className="text-second h-5 w-full text-center text-sm">
                                    <Trans>{formatTokenItemAmount(availableSharesBN, 2)} shares available</Trans>
                                </div>
                            </Skeleton>
                        </div>
                    );
                }}
            />
            <div className="w-full space-y-4 p-4">
                <div className="flex justify-between px-2">
                    <div>
                        <div className="text-main text-lg font-bold">
                            <Trans>Will receive</Trans>
                        </div>
                        <div className="text-second flex h-5 items-center gap-1 text-[13px] leading-5">
                            <span>
                                <Trans>Avg. Price</Trans>
                            </span>
                            <Skeleton className="h-5 w-24" isLoading={isLoadingToWin}>
                                <div className="h-5">
                                    {toWin?.avg_price ? (
                                        <>{formatPriceToCents(toWin.avg_price)}</>
                                    ) : (
                                        formatPriceToCents(0)
                                    )}
                                </div>
                            </Skeleton>
                        </div>
                    </div>
                    <div className="text-success text-lg font-bold">
                        <Skeleton className="h-5 w-24" isLoading={isLoadingToWin}>
                            <div>{toWin?.win_amount ? formatPnlUSD(toWin.win_amount) : null}</div>
                        </Skeleton>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                    {[0.25, 0.5, 0.75, 1].map((rate) => (
                        <button
                            key={rate}
                            className={cn(
                                'bg-lightBg active:bg-main/10 h-8 min-w-[70px] rounded-full px-4 text-center font-semibold leading-8 duration-75 active:scale-95',
                                { 'text-highlight': rate === 1 },
                            )}
                            onClick={() => {
                                const max = availableSharesBN;
                                if (!max.isFinite() || max.lte(0)) {
                                    form.setValue('shares', '0', {
                                        shouldDirty: true,
                                        shouldTouch: true,
                                        shouldValidate: true,
                                    });
                                    return;
                                }
                                const next = rate >= 1 ? max : max.times(rate);
                                // Always round down, then clamp to available to avoid any accidental over-max.
                                const rounded = BigNumber.max(0, next).decimalPlaces(2, BigNumber.ROUND_FLOOR);
                                const clamped = BigNumber.min(max, rounded);
                                form.setValue('shares', clamped.toString(), {
                                    shouldDirty: true,
                                    shouldTouch: true,
                                    shouldValidate: true,
                                });
                            }}
                        >
                            {rate === 1 ? <Trans>Max</Trans> : `${rate * 100}%`}
                        </button>
                    ))}
                </div>

                <Button
                    variant="primary"
                    size="lg"
                    className="h-12 w-full rounded-full"
                    disabled={Boolean(submitDisabled) || !canSubmit || loading}
                    loading={loading}
                    onClick={() => {
                        if (submitDisabled) return;
                        return onSubmit({ shares: sharesBN.toNumber() });
                    }}
                >
                    {isOverMax ? <Trans>Insufficient Balance</Trans> : <Trans>Sell {outcome}</Trans>}
                </Button>
            </div>
        </div>
    );
}

export function SellLimitForm({
    outcome,
    tokenId,
    conditionId,
    defaultLimitPrice,
    orderPriceMinTickSize,
    loading,
    onSubmit,
    submitDisabled,
}: {
    outcome: string;
    tokenId: string;
    conditionId: string;
    defaultLimitPrice?: string | number | null;
    orderPriceMinTickSize?: number | null;
    loading?: boolean;
    onSubmit: (args: SubmitLimitArgs) => Promise<unknown> | void;
    submitDisabled?: boolean;
}) {
    const form = useForm<{ shares: string; limitPriceCents: string }>({
        defaultValues: { limitPriceCents: '', shares: '' },
        mode: 'onChange',
    });

    useSyncLimitPriceCents(form, { defaultLimitPrice, tokenId, orderPriceMinTickSize });
    const limitPriceCfg = useMemo(() => getLimitPriceCentsInputConfig(orderPriceMinTickSize), [orderPriceMinTickSize]);

    const { register } = form;
    const sharesRegister = register('shares', {
        setValueAs: (v) => normalizeBetInput(String(v ?? ''), 'shares'),
    });
    const shares = form.watch('shares') ?? '';
    const limitPriceCents = form.watch('limitPriceCents');

    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const { data: availableShares = '0', isLoading: isLoadingAvailableShares } = useQuery({
        ...getAvailableSharesByConditionIdQueryOptions(account.proxyAddress, conditionId ?? '', tokenId),
        enabled: Boolean(conditionId),
    });

    const availableSharesBN = safeBigNumber(availableShares, 0);
    const sharesBN = safeBigNumber(shares, 0);

    const limitPriceDollars = BigNumber(limitPriceCents || 0).div(100);
    const limitPriceNum =
        Number.isFinite(limitPriceDollars.toNumber()) && limitPriceDollars.toNumber() > 0
            ? limitPriceDollars.toNumber()
            : 0;

    const { data: toWin, isLoading: isLoadingToWin } = useQuery({
        ...getPolymarketToWinAmountQueryOptions('SELL', tokenId, sharesBN.toNumber(), {
            isLimit: true,
            limitPrice: limitPriceNum,
        }),
        enabled: sharesBN.gt(0) && limitPriceNum > 0,
        refetchInterval: sharesBN.gt(0) && limitPriceNum > 0 ? POLYMARKET_QUOTE_POLL_MS : false,
    });

    const isOverMax = sharesBN.gt(availableSharesBN);
    const canSubmit = sharesBN.gt(0) && !isOverMax && limitPriceDollars.gt(0) && limitPriceDollars.lt(1);

    return (
        <div className="flex w-full flex-1 flex-col">
            <div className="flex w-full flex-col gap-6 pt-6">
                <div className="flex w-full items-center justify-between px-4">
                    <div className="flex flex-col items-start justify-center">
                        <div className="text-main text-base font-semibold leading-6">
                            <Trans>Limit Price</Trans>
                        </div>
                    </div>
                    <Controller
                        control={form.control}
                        name="limitPriceCents"
                        render={({ field }) => {
                            return (
                                <BetLimitPriceCentsInput
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                    step={limitPriceCfg.step}
                                    maxDecimals={limitPriceCfg.maxDecimals}
                                    max={limitPriceCfg.max}
                                />
                            );
                        }}
                    />
                </div>

                <div className="flex w-full flex-col items-end gap-4 px-4">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex flex-col items-start justify-center">
                            <div className="text-main text-base font-semibold leading-6">
                                <Trans>Shares</Trans>
                            </div>
                            <Skeleton className="h-[17px] w-full max-w-[140px]" isLoading={isLoadingAvailableShares}>
                                <div className="text-second text-[13px] leading-[17px]">
                                    <Trans>Available {formatTokenItemAmount(availableSharesBN, 2)}</Trans>
                                </div>
                            </Skeleton>
                        </div>
                        <div className="border-line flex h-12 w-[180px] items-center justify-center rounded-lg border bg-transparent px-2 py-2.5">
                            <input
                                type="number"
                                inputMode="decimal"
                                {...sharesRegister}
                                autoComplete="off"
                                className={cn(
                                    'ring-none w-full appearance-none border-none bg-transparent text-center text-lg font-bold tabular-nums leading-6 outline-none focus:ring-0',
                                    {
                                        'text-danger': isOverMax,
                                        'text-second': sharesBN.lte(0),
                                        'text-main': !isOverMax && sharesBN.gt(0),
                                    },
                                )}
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-start gap-2">
                        {[0.25, 0.5, 0.75, 1].map((rate) => (
                            <button
                                key={rate}
                                className={cn(
                                    'border-line rounded-lg border bg-transparent px-4 py-2 text-sm font-medium leading-4 active:scale-95',
                                    { 'text-highlight': rate === 1, 'text-main': rate !== 1 },
                                )}
                                onClick={() => {
                                    const max = availableSharesBN;
                                    if (!max.isFinite() || max.lte(0)) {
                                        form.setValue('shares', '0', {
                                            shouldDirty: true,
                                            shouldTouch: true,
                                            shouldValidate: true,
                                        });
                                        return;
                                    }
                                    const next = rate >= 1 ? max : max.times(rate);
                                    const rounded = BigNumber.max(0, next).decimalPlaces(2, BigNumber.ROUND_FLOOR);
                                    // Extra safety: never set shares above available (even with any rounding artifacts).
                                    const clamped = BigNumber.min(max, rounded);
                                    form.setValue('shares', normalizeBetInput(clamped.toString(), 'shares'), {
                                        shouldDirty: true,
                                        shouldTouch: true,
                                        shouldValidate: true,
                                    });
                                }}
                            >
                                {rate === 1 ? <Trans>Max</Trans> : `${rate * 100}%`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-auto w-full space-y-4 p-4">
                <div className="flex justify-between px-2">
                    <div className="text-main text-lg font-bold">
                        <Trans>Will receive</Trans>
                    </div>
                    <Skeleton className="h-6 w-24" isLoading={isLoadingToWin}>
                        {toWin?.win_amount ? (
                            <div className="text-success h-6 text-lg font-bold">{formatPnlUSD(toWin?.win_amount)}</div>
                        ) : null}
                    </Skeleton>
                </div>

                <Button
                    variant="primary"
                    size="lg"
                    className="h-12 w-full rounded-full"
                    disabled={Boolean(submitDisabled) || !canSubmit || loading}
                    loading={loading}
                    onClick={() => {
                        if (submitDisabled) return;
                        return onSubmit({ shares: sharesBN.toNumber(), limitPrice: limitPriceDollars.toNumber() });
                    }}
                >
                    {isOverMax ? <Trans>Insufficient Balance</Trans> : <Trans>Sell {outcome}</Trans>}
                </Button>
            </div>
        </div>
    );
}
