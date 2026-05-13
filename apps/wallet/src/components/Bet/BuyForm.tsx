import LightningIcon from '@dimensiondev/assets/lightning.svg';
import { formatPriceToCents } from '@dimensiondev/utils';
import { createWagmiPublicClient } from '@dimensiondev/web3/actions';
import { safe } from '@dimensiondev/web3/numbers';
import { isSameAddress, resolvePublicRpcUrl } from '@dimensiondev/web3/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useDebounceValue } from 'usehooks-ts';
import { type Address, erc20Abi, parseUnits } from 'viem';
import { polygon } from 'viem/chains';
import { type Config, type Connection, useConfig, useConnection, useConnections } from 'wagmi';
import { simulateContract, waitForTransactionReceipt, writeContract } from 'wagmi/actions';

import { BetAmountStepper } from '@/components/Bet/BetAmountStepper.js';
import { BetLimitPriceCentsInput } from '@/components/Bet/BetLimitPriceCentsInput.js';
import { QuickBuyConfirmDialog } from '@/components/Bet/QuickBuyConfirmDialog.js';
import { useSyncLimitPriceCents } from '@/components/Bet/useSyncLimitPriceCents.js';
import { Skeleton } from '@/components/Skeleton.js';
import { Button } from '@/components/ui/button.js';
import { InsufficientGasError } from '@/constants/error.js';
import { P_USDC_POLYGON_ADDRESS } from '@/constants/ethereum.js';
import { PRIVY_CONNECTOR_ID } from '@/constants/static.js';
import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { getUserFacingErrorMessage } from '@/helpers/getErrorMessage.js';
import { getLimitPriceCentsInputConfig } from '@/helpers/getLimitPriceCentsInputConfig.js';
import { normalizeBetInput } from '@/helpers/normalizeBetInput.js';
import { computePolymarketMarketBuyFeeUsd, parsePolymarketTakerFeeRate } from '@/helpers/polymarketTakerFee.js';
import { switchEvmConnectorChain } from '@/helpers/resolveEvmConnector.js';
import { cn } from '@/lib/utils.js';
import type { TokenAsset } from '@/providers/types/Firefly.js';
import type { Token } from '@/providers/types/Transfer.js';
import { getBetsAvailableUSDQueryOptions } from '@/queries/firefly/getBetsAvailableUSDQueryOptions.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getPolymarketToWinAmountQueryOptions } from '@/queries/firefly/getPolymarketToWinAmountQueryOptions.js';
import { getPolymarketWithdrawableAmountQueryOptions } from '@/queries/firefly/getPolymarketWithdrawableAmountQueryOptions.js';
import { getMultiChainTokensQuery } from '@/queries/firefly/multiChainTokens.js';
import { getPolymarketUserValueQueryOptions } from '@/queries/polymarket/getPolymarketUserValueQueryOptions.js';
import { showEmbeddedWalletUIAtom } from '@/store/embeddedWallets.js';
import { store } from '@/store/index.js';

const MINIMUM_USD = 0;
const POLYMARKET_QUOTE_POLL_MS = 3000;

function useWalletUsdcPolBalance() {
    const { address } = useConnection();
    const { data: walletUsdcBalance = 0 } = useQuery({
        ...getMultiChainTokensQuery(address ? [address as Address] : [], [polygon.id]),
        enabled: Boolean(address),
        select(data: { tokenAssets?: TokenAsset[] } | null | undefined): number {
            const tokens = (data?.tokenAssets ?? []).map((x: TokenAsset) => formatTokenFromFireflyTokenAsset(x));
            const usdc = tokens.find((t: Token) => isSameAddress(String(t.id), P_USDC_POLYGON_ADDRESS));
            return usdc?.amount ?? 0;
        },
    });
    return walletUsdcBalance;
}

async function topUpBetsAccountFromWallet(params: {
    config: Config;
    wallet: Connection;
    fromAddress: Address;
    proxyAddress: Address;
    topUpUsd: BigNumber;
}) {
    const { config, wallet, fromAddress, proxyAddress, topUpUsd } = params;
    if (topUpUsd.lte(0)) return;

    const connector = wallet.connector;
    await switchEvmConnectorChain(connector, polygon.id);

    const parsedValue = parseUnits(topUpUsd.decimalPlaces(6, BigNumber.ROUND_CEIL).toFixed(6), 6);

    const transferCall = {
        abi: erc20Abi,
        address: P_USDC_POLYGON_ADDRESS as Address,
        functionName: 'transfer' as const,
        args: [proxyAddress, parsedValue] as const,
        chainId: polygon.id,
    };

    const { request } = await simulateContract(config, transferCall);

    let gas: bigint | undefined;
    try {
        const client = createWagmiPublicClient(polygon.id, resolvePublicRpcUrl(polygon.id));
        const estimated = await client.estimateContractGas({
            ...transferCall,
            account: fromAddress,
        });
        gas = (estimated * 120n) / 100n;
    } catch {
        gas = undefined;
    }

    if (gas) {
        const client = createWagmiPublicClient(polygon.id, resolvePublicRpcUrl(polygon.id));
        const [gasPrice, nativeBalance] = await Promise.all([
            client.getGasPrice(),
            client.getBalance({ address: fromAddress }),
        ]);
        const fee = gas * gasPrice;
        if (nativeBalance < fee) {
            throw new InsufficientGasError();
        }
    }

    const txHash = await writeContract(config, {
        ...request,
        gas: gas ?? request.gas,
    });
    await waitForTransactionReceipt(config, {
        hash: txHash,
        chainId: polygon.id,
    });
}

function useQuickBuyAction(params: {
    proxyAddress: Address;
    topUpUsd: BigNumber;
    submitDisabled?: boolean;
    loading?: boolean;
    onPlaceOrder: () => Promise<unknown> | void;
}) {
    const { proxyAddress, topUpUsd, submitDisabled, loading, onPlaceOrder } = params;
    const config = useConfig();
    const { address } = useConnection();
    const connections = useConnections();
    const queryClient = useQueryClient();
    const isSubmittingRef = useRef(false);
    const [isQuickBuying, setIsQuickBuying] = useState(false);

    const embeddedWallet = useMemo(() => connections.find((c) => c.connector.id === PRIVY_CONNECTOR_ID), [connections]);

    const runQuickBuy = useCallback(async () => {
        if (submitDisabled) return;
        if (isSubmittingRef.current || loading || isQuickBuying) return;
        if (!address || !embeddedWallet) return toast.error(<Trans>Unable to add funds to predictions account.</Trans>);

        isSubmittingRef.current = true;

        try {
            setIsQuickBuying(true);
            store.set(showEmbeddedWalletUIAtom, false);

            try {
                await topUpBetsAccountFromWallet({
                    config,
                    wallet: embeddedWallet,
                    fromAddress: address as Address,
                    proxyAddress,
                    topUpUsd,
                });

                // Refresh Home balances (Available + Portfolio) after top-up.
                await Promise.all([
                    queryClient.refetchQueries({
                        queryKey: getPolymarketWithdrawableAmountQueryOptions(proxyAddress).queryKey,
                    }),
                    queryClient.refetchQueries({
                        queryKey: getPolymarketUserValueQueryOptions(proxyAddress).queryKey,
                    }),
                    queryClient.refetchQueries({
                        queryKey: getBetsAvailableUSDQueryOptions(proxyAddress).queryKey,
                    }),
                ]);
            } catch (error: unknown) {
                const { message: userHint, details } = getUserFacingErrorMessage(error);
                return toast.error(<Trans>Unable to add funds to predictions account.</Trans>, {
                    description: userHint || details,
                });
            } finally {
                store.set(showEmbeddedWalletUIAtom, true);
            }

            return await onPlaceOrder();
        } finally {
            setIsQuickBuying(false);
            isSubmittingRef.current = false;
        }
    }, [
        address,
        embeddedWallet,
        config,
        isQuickBuying,
        loading,
        onPlaceOrder,
        proxyAddress,
        queryClient,
        submitDisabled,
        topUpUsd,
    ]);

    return { runQuickBuy, isQuickBuying };
}

export function BuyMarketForm({
    outcome,
    tokenId,
    onSubmit,
    loading,
    submitDisabled,
    feesEnabled,
    feeSchedule,
    outcomeAvgPriceForFee,
}: {
    outcome: string;
    tokenId: string;
    onSubmit: (amount: string) => Promise<unknown> | void;
    loading?: boolean;
    submitDisabled?: boolean;
    feesEnabled?: boolean | null;
    feeSchedule?: { rate?: string | null } | null;
    /** Gamma outcome price (0–1) for fee math; mirrors Android `conditionOutcomes` price. */
    outcomeAvgPriceForFee?: number;
}) {
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const { data: availableAmount } = useSuspenseQuery(getBetsAvailableUSDQueryOptions(account.proxyAddress));
    const isLoadingAvailableAmount = false;
    const walletUsdcBalance = useWalletUsdcPolBalance();

    const form = useForm<{ amount: string }>({
        mode: 'onChange',
    });
    const amount = form.watch('amount');
    const amountBN = safe(amount, 0);

    const feeRate = useMemo(() => parsePolymarketTakerFeeRate(feesEnabled, feeSchedule), [feesEnabled, feeSchedule]);
    const avgPriceForFee =
        typeof outcomeAvgPriceForFee === 'number' &&
        Number.isFinite(outcomeAvgPriceForFee) &&
        outcomeAvgPriceForFee > 0 &&
        outcomeAvgPriceForFee < 1
            ? outcomeAvgPriceForFee
            : 0.5;
    const takerFeeUsd = useMemo(() => {
        if (!amountBN.isFinite() || amountBN.lte(0)) return BigNumber(0);
        return computePolymarketMarketBuyFeeUsd(amountBN, feeRate, avgPriceForFee);
    }, [amountBN, avgPriceForFee, feeRate]);
    const totalSpendUsd = amountBN.plus(takerFeeUsd);

    const [debouncedAmount] = useDebounceValue(amount, 300);
    const shouldPollQuote = safe(debouncedAmount, 0).gt(0);
    const { data: toWin, isLoading: isLoadingToWin } = useQuery({
        ...getPolymarketToWinAmountQueryOptions('BUY', tokenId, debouncedAmount),
        refetchInterval: shouldPollQuote ? POLYMARKET_QUOTE_POLL_MS : false,
    });

    const betsBalance = BigNumber(availableAmount || 0);
    const totalBalance = betsBalance.plus(walletUsdcBalance || 0);
    const isOverTotalBalance = totalSpendUsd.gt(totalBalance);
    const isOverBetsBalance = totalSpendUsd.gt(betsBalance);
    const isLessThanMinimum = Boolean(amount) && amountBN.lt(MINIMUM_USD);
    const inputValid = amountBN.gt(0);
    const canNormalBuy = inputValid && !isOverBetsBalance && !isLessThanMinimum;
    const canQuickBuy = inputValid && !isOverTotalBalance && !isLessThanMinimum;
    const showQuickBuyButtons = canQuickBuy && !canNormalBuy;
    const [quickBuyConfirmOpen, setQuickBuyConfirmOpen] = useState(false);

    const { runQuickBuy, isQuickBuying } = useQuickBuyAction({
        proxyAddress: account.proxyAddress as Address,
        topUpUsd: BigNumber.max(0, totalSpendUsd.minus(betsBalance)),
        submitDisabled,
        loading,
        onPlaceOrder: () => onSubmit(amount),
    });

    const runNormalBuy = useCallback(async () => {
        if (submitDisabled) return;
        if (loading || isQuickBuying) return;
        return onSubmit(amount);
    }, [amount, isQuickBuying, loading, onSubmit, submitDisabled]);

    return (
        <div className="flex w-full flex-1 flex-col">
            <Controller
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <div className="flex w-full flex-1 flex-col items-center justify-center">
                        <BetAmountStepper
                            value={field.value ? `$${field.value}` : ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                return field.onChange(value === '$' ? '' : normalizeBetInput(value, 'usd'));
                            }}
                            onDecrease={() => {
                                const n = safe(field.value, 0);
                                field.onChange(normalizeBetInput(BigNumber.max(0, n.minus(1)).toString(), 'usd'));
                            }}
                            onIncrease={() => {
                                const n = safe(field.value, 0);
                                field.onChange(normalizeBetInput(BigNumber.max(0, n.plus(1)).toString(), 'usd'));
                            }}
                            decreaseDisabled={BigNumber(field.value || 0).lte(0)}
                            inputProps={{
                                placeholder: '$0',
                            }}
                            inputClassName={cn({
                                'text-danger': isOverTotalBalance,
                            })}
                        />
                        <Skeleton className="h-5 w-full max-w-[100px]" isLoading={isLoadingAvailableAmount}>
                            {availableAmount ? (
                                <div className="text-second h-5 w-full text-center text-sm">
                                    <Trans>{formatTokenUSD(availableAmount, { minDisplay: 0.01 })} available</Trans>
                                </div>
                            ) : null}
                        </Skeleton>
                    </div>
                )}
            />
            <div className="w-full space-y-4 p-4">
                <div className="flex justify-between px-2">
                    <div>
                        <div className="text-main text-lg font-bold">
                            <Trans>To win</Trans>
                        </div>
                        <div className="text-second flex h-5 items-center gap-1 text-[13px] leading-5">
                            <span>
                                <Trans>Avg. Price</Trans>
                            </span>
                            <Skeleton className="h-5 w-24" isLoading={isLoadingToWin}>
                                <div className="h-5">{formatPriceToCents(toWin?.avg_price ?? 0)}</div>
                            </Skeleton>
                        </div>
                    </div>
                    <div className="text-success text-lg font-bold">
                        <Skeleton className="h-5 w-24" isLoading={isLoadingToWin}>
                            <div>{formatTokenUSD(toWin?.win_amount ?? 0, { minDisplay: 0.01 })}</div>
                        </Skeleton>
                    </div>
                </div>
                {takerFeeUsd.gt(0) ? (
                    <div className="text-second flex justify-between px-2 text-[13px]">
                        <span>
                            <Trans>Est. fee</Trans>
                        </span>
                        <span>{formatTokenUSD(takerFeeUsd.toString(), { minDisplay: 0.01 })}</span>
                    </div>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                    {[1, 20, 100, 'Max'].map((price) => (
                        <button
                            key={price}
                            className={cn(
                                'bg-lightBg active:bg-main/10 h-8 min-w-[70px] rounded-full px-4 text-center font-semibold leading-8 duration-75 active:scale-95',
                                {
                                    'text-highlight': price === 'Max',
                                },
                            )}
                            onClick={() => {
                                if (price === 'Max') {
                                    const maxBalance = BigNumber(availableAmount || 0);
                                    const fee = computePolymarketMarketBuyFeeUsd(maxBalance, feeRate, avgPriceForFee);
                                    const next = normalizeBetInput(
                                        BigNumber.max(0, maxBalance.minus(fee)).toString(),
                                        'usd',
                                    );
                                    form.setValue('amount', next, {
                                        shouldDirty: true,
                                        shouldTouch: true,
                                        shouldValidate: true,
                                    });
                                    return;
                                }
                                const n = safe(amount, 0);
                                const next = normalizeBetInput(n.plus(price).toString(), 'usd');
                                form.setValue('amount', next, {
                                    shouldDirty: true,
                                    shouldTouch: true,
                                    shouldValidate: true,
                                });
                            }}
                        >
                            {price === 'Max' ? <Trans>Max</Trans> : `+$${price}`}
                        </button>
                    ))}
                </div>
                {showQuickBuyButtons ? (
                    <>
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-12 w-full rounded-full"
                            disabled={Boolean(submitDisabled) || !canQuickBuy || isQuickBuying || loading}
                            loading={isQuickBuying}
                            onClick={() => setQuickBuyConfirmOpen(true)}
                        >
                            <LightningIcon width={18} height={18} className="shrink-0" />
                            <Trans>Quick Buy</Trans>
                        </Button>

                        <QuickBuyConfirmDialog
                            open={quickBuyConfirmOpen}
                            onOpenChange={setQuickBuyConfirmOpen}
                            outcome={outcome}
                            predictWalletPayUsd={BigNumber.min(betsBalance, totalSpendUsd)}
                            fireflyWalletPayUsd={BigNumber.max(
                                0,
                                totalSpendUsd.minus(BigNumber.min(betsBalance, totalSpendUsd)),
                            )}
                            fireflyWalletAvailableUsd={walletUsdcBalance || 0}
                            totalUsd={totalSpendUsd}
                            confirmDisabled={Boolean(submitDisabled) || !canQuickBuy}
                            confirming={isQuickBuying}
                            onConfirm={async () => {
                                setQuickBuyConfirmOpen(false);
                                await runQuickBuy();
                            }}
                        />
                    </>
                ) : (
                    <Button
                        variant="primary"
                        size="lg"
                        className="h-12 w-full rounded-full"
                        disabled={
                            Boolean(submitDisabled) || !inputValid || isLessThanMinimum || isOverTotalBalance || loading
                        }
                        loading={loading}
                        onClick={runNormalBuy}
                    >
                        {isOverTotalBalance ? (
                            <Trans>Insufficient Balance</Trans>
                        ) : isLessThanMinimum ? (
                            <Trans>Minimum $1.00</Trans>
                        ) : (
                            <Trans>Buy {outcome}</Trans>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}

export function BuyLimitForm({
    outcome,
    tokenId,
    defaultLimitPrice,
    orderPriceMinTickSize,
    onSubmit,
    loading,
    submitDisabled,
}: {
    outcome: string;
    tokenId: string;
    defaultLimitPrice?: string | number | null;
    orderPriceMinTickSize?: number | null;
    onSubmit: (params: { shares: number; limitPrice: number }) => Promise<unknown> | void;
    loading?: boolean;
    submitDisabled?: boolean;
}) {
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const { data: availableAmount } = useSuspenseQuery(getBetsAvailableUSDQueryOptions(account.proxyAddress));
    const isLoadingAvailableAmount = false;
    const walletUsdcBalance = useWalletUsdcPolBalance();

    const form = useForm<{ limitPriceCents: string; shares: string }>({
        defaultValues: { limitPriceCents: '', shares: '' },
        mode: 'onChange',
    });

    useSyncLimitPriceCents(form, { defaultLimitPrice, tokenId, orderPriceMinTickSize });
    const limitPriceCfg = useMemo(() => getLimitPriceCentsInputConfig(orderPriceMinTickSize), [orderPriceMinTickSize]);

    const { register, control } = form;
    const sharesRegister = register('shares', {
        setValueAs: (v) => normalizeBetInput(String(v ?? ''), 'shares'),
    });

    const limitPriceCents = form.watch('limitPriceCents');
    const shares = form.watch('shares') ?? '';

    const limitPriceDollars = BigNumber(limitPriceCents || 0).div(100);

    const p = limitPriceDollars;
    const betsBalance = BigNumber(availableAmount || 0);
    const totalBalance = betsBalance.plus(walletUsdcBalance || 0);

    const sharesBN = BigNumber(shares || 0);

    const total = sharesBN.times(limitPriceDollars);
    const totalUSD = total.isFinite() ? total : BigNumber(0);

    const isOverTotalBalance = totalUSD.isFinite() ? totalUSD.gt(totalBalance) : false;
    const isOverBetsBalance = totalUSD.isFinite() ? totalUSD.gt(betsBalance) : false;

    const sharesNum = Number.isFinite(Number(shares)) && Number(shares) > 0 ? Number(shares) : 0;

    const limitPriceNum =
        Number.isFinite(limitPriceDollars.toNumber()) && limitPriceDollars.toNumber() > 0
            ? limitPriceDollars.toNumber()
            : 0;

    const { data: winAmount, isLoading: isLoadingWinAmount } = useQuery({
        ...getPolymarketToWinAmountQueryOptions('BUY', tokenId!, sharesNum, {
            isLimit: true,
            limitPrice: limitPriceNum,
        }),
        enabled: Boolean(tokenId) && sharesNum > 0 && limitPriceNum > 0,
        refetchInterval: Boolean(tokenId) && sharesNum > 0 && limitPriceNum > 0 ? POLYMARKET_QUOTE_POLL_MS : false,
        select(res) {
            return res.win_amount;
        },
    });

    const meetsMinimum = totalUSD.gte(MINIMUM_USD);
    const canQuickBuy =
        sharesBN.isFinite() &&
        sharesBN.gt(0) &&
        !isOverTotalBalance &&
        limitPriceDollars.gt(0) &&
        limitPriceDollars.lt(1) &&
        meetsMinimum;
    const canNormalBuy =
        sharesBN.isFinite() &&
        sharesBN.gt(0) &&
        !isOverBetsBalance &&
        limitPriceDollars.gt(0) &&
        limitPriceDollars.lt(1) &&
        meetsMinimum;
    const isLessThanMinimum = totalUSD.lt(MINIMUM_USD);
    const showQuickBuyButtons = canQuickBuy && !canNormalBuy;
    const [quickBuyConfirmOpen, setQuickBuyConfirmOpen] = useState(false);

    const { runQuickBuy, isQuickBuying } = useQuickBuyAction({
        proxyAddress: account.proxyAddress as Address,
        topUpUsd: BigNumber.max(0, totalUSD.minus(betsBalance)),
        submitDisabled,
        loading,
        onPlaceOrder: () =>
            onSubmit({
                shares: Number(shares),
                limitPrice: limitPriceDollars.toNumber(),
            }),
    });

    const runNormalBuy = useCallback(async () => {
        if (submitDisabled) return;
        if (loading || isQuickBuying) return;
        return onSubmit({
            shares: Number(shares),
            limitPrice: limitPriceDollars.toNumber(),
        });
    }, [isQuickBuying, limitPriceDollars, loading, onSubmit, shares, submitDisabled]);

    function setSharesByDelta(delta: BigNumber.Value | 'max') {
        if (delta === 'max') {
            // "Max" should match the "Available" amount shown (prediction wallet / bets balance).
            // Only fall back to total balance when bets balance is zero, so users can still Quick Buy easily.
            const balance = betsBalance.gt(0) ? betsBalance : BigNumber(totalBalance || 0);
            const maxShares =
                balance.gt(0) && p.isFinite() && p.gt(0)
                    ? balance.div(p).decimalPlaces(2, BigNumber.ROUND_FLOOR)
                    : BigNumber(0);
            const v = normalizeBetInput(maxShares.toString(), 'shares');
            form.setValue('shares', v, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
            return;
        }
        const base = sharesBN.isFinite() ? sharesBN : BigNumber(0);
        const next = BigNumber.max(0, base.plus(delta)).decimalPlaces(2, BigNumber.ROUND_FLOOR);
        form.setValue('shares', normalizeBetInput(next.toString(), 'shares'), {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });
    }

    return (
        <div className="flex w-full flex-1 flex-col">
            <div className="flex w-full flex-col gap-6 pt-6">
                <div className="flex w-full items-center justify-between px-4">
                    <div className="flex flex-col items-start justify-center">
                        <div className="text-main text-base font-semibold leading-6">
                            <Trans>Limit Price</Trans>
                        </div>
                        <Skeleton className="h-[18px] w-full max-w-[100px]" isLoading={isLoadingAvailableAmount}>
                            <div className="text-second h-[18px] text-[13px] font-normal leading-[18px]">
                                {availableAmount ? (
                                    <Trans>Available {formatTokenUSD(availableAmount, { minDisplay: 0.01 })}</Trans>
                                ) : null}
                            </div>
                        </Skeleton>
                    </div>
                    <Controller
                        name="limitPriceCents"
                        control={control}
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
                        <div className="text-main text-base font-semibold leading-6">
                            <Trans>Shares</Trans>
                        </div>
                        <div className="border-line flex h-12 w-[180px] items-center justify-center rounded-lg border bg-transparent px-2 py-2.5">
                            <input
                                type="number"
                                inputMode="decimal"
                                min={0}
                                {...sharesRegister}
                                autoComplete="off"
                                className={cn(
                                    'ring-none w-full appearance-none border-none bg-transparent text-center text-lg font-bold tabular-nums leading-6 outline-none focus:ring-0',
                                    {
                                        'text-danger': isOverTotalBalance,
                                        'text-second': sharesBN.isZero(),
                                        'text-main': !sharesBN.isZero(),
                                    },
                                )}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-start gap-2">
                        {[
                            { label: '-100', delta: -100 },
                            { label: '-10', delta: -10 },
                            { label: '+10', delta: 10 },
                            { label: '+100', delta: 100 },
                            { label: <Trans>Max</Trans>, delta: 'max' as const },
                        ].map((x) => (
                            <button
                                key={x.delta}
                                className={cn(
                                    'border-line flex items-center justify-center gap-2.5 rounded-lg border bg-transparent p-2 active:scale-95',
                                    x.delta === 'max' ? 'text-highlight' : 'text-main',
                                )}
                                onClick={() => {
                                    return setSharesByDelta(x.delta);
                                }}
                            >
                                <div className="text-sm font-medium leading-4">{x.label}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-auto w-full space-y-4 p-4">
                <div className="flex flex-col gap-2 px-2">
                    <div className="inline-flex w-full items-center justify-between">
                        <div className="text-main text-center text-lg font-bold leading-6">
                            <Trans>Total</Trans>
                        </div>
                        <div className="text-main text-center text-lg font-bold leading-6">
                            {formatTokenUSD(totalUSD.toString(), { minDisplay: 0.01 })}
                        </div>
                    </div>
                    <div className="inline-flex w-full items-center justify-between">
                        <div className="text-main text-center text-lg font-bold leading-6">
                            <Trans>To win</Trans>
                        </div>
                        <Skeleton className="h-5 w-full max-w-24" isLoading={isLoadingWinAmount}>
                            <div
                                className={cn('text-success text-center text-lg font-bold leading-6', {
                                    'text-second': !winAmount,
                                })}
                            >
                                {winAmount ? formatTokenUSD(winAmount, { minDisplay: 0.01 }) : '$0'}
                            </div>
                        </Skeleton>
                    </div>
                </div>

                {showQuickBuyButtons ? (
                    <>
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-12 w-full rounded-full"
                            disabled={Boolean(submitDisabled) || !canQuickBuy || isQuickBuying || loading}
                            loading={isQuickBuying}
                            onClick={() => setQuickBuyConfirmOpen(true)}
                        >
                            <LightningIcon width={18} height={18} className="shrink-0" />
                            <Trans>Quick Buy</Trans>
                        </Button>

                        <QuickBuyConfirmDialog
                            open={quickBuyConfirmOpen}
                            onOpenChange={setQuickBuyConfirmOpen}
                            outcome={outcome}
                            predictWalletPayUsd={BigNumber.min(betsBalance, totalUSD)}
                            fireflyWalletPayUsd={BigNumber.max(0, totalUSD.minus(BigNumber.min(betsBalance, totalUSD)))}
                            fireflyWalletAvailableUsd={walletUsdcBalance || 0}
                            totalUsd={totalUSD}
                            confirmDisabled={Boolean(submitDisabled) || !canQuickBuy}
                            confirming={isQuickBuying}
                            onConfirm={async () => {
                                setQuickBuyConfirmOpen(false);
                                await runQuickBuy();
                            }}
                        />
                    </>
                ) : (
                    <Button
                        variant="primary"
                        size="lg"
                        className="h-12 w-full rounded-full"
                        disabled={
                            Boolean(submitDisabled) || !canQuickBuy || loading || isQuickBuying || isOverTotalBalance
                        }
                        loading={loading}
                        title={isOverTotalBalance ? t`Insufficient Balance` : undefined}
                        onClick={runNormalBuy}
                    >
                        {isOverTotalBalance ? (
                            <Trans>Insufficient Balance</Trans>
                        ) : isLessThanMinimum ? (
                            <Trans>Minimum $1.00</Trans>
                        ) : (
                            <Trans>Buy {outcome}</Trans>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}
