import { PRIVY_CONNECTOR_ID } from '@dimensiondev/constants/static';
import { createPerpsClient } from '@dimensiondev/perps-core';
import { usePerpsComputedAccountValue } from '@dimensiondev/perps-react';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useConnectors, useWalletClient } from 'wagmi';

import BackIcon from '@/assets/perps-profile/back.svg';
import InfoIcon from '@/assets/perps-withdraw/info.svg';
import ServiceInfoIcon from '@/assets/perps-withdraw/service-info.svg';
import UsdcIcon from '@/assets/perps-withdraw/usdc.svg';
import { ChainIcon } from '@/components/ChainIcon.js';
import { NavigationBar } from '@/components/NavigationBar.js';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer.js';
import { ARBITRUM_CHAIN_ID } from '@/constants/hyperliquid.js';
import { invalidatePerpsQueries } from '@/helpers/invalidatePerpsQueries.js';
import { normalizeDecimalInput } from '@/helpers/normalizeDecimalInput.js';
import { publishPerpsMutation } from '@/helpers/perpsMutation.js';
import { withSkipPinCodeCheck } from '@/helpers/withSkipPinCodeCheck.js';
import { useEmbeddedEvmWalletContext } from '@/hooks/useCachedWalletAddresses.js';
import { useIsPerpsBlocked } from '@/hooks/useGeoblock.js';
import { cn } from '@/lib/utils.js';

const MINIMUM_WITHDRAWAL = '1';
const EXECUTION_FEE = '1';
const PERCENTAGES = [25, 50, 75] as const;

function formatInputAmount(value: string) {
    if (!value) return '0';
    const [integer = '0', fraction] = value.split('.');
    const formattedInteger = new BigNumber(integer || '0').toFormat(0);
    return fraction === undefined ? formattedInteger : `${formattedInteger}.${fraction}`;
}

function formatAvailable(value?: string) {
    const amount = new BigNumber(value || '0');
    return amount.isFinite() ? amount.toFormat(2) : '--';
}

function formatReceiveAmount(value: string) {
    const amount = new BigNumber(value || '0');
    if (!amount.isFinite() || !amount.isPositive()) return '0';
    // Hyperliquid deducts the fixed execution fee from the withdrawn amount, so the
    // destination wallet receives the requested amount minus the fee (never below 0).
    return BigNumber.maximum(amount.minus(EXECUTION_FEE), 0).toFormat();
}

function publishResult(status: 'success' | 'failed' | 'cancelled') {
    publishPerpsMutation('withdraw', status);
}

export default function PerpsWithdrawPage() {
    const [amount, setAmount] = useState('');
    const [showServiceFee, setShowServiceFee] = useState(false);
    const connectors = useConnectors();
    const queryClient = useQueryClient();
    const { address, isLoading: isWalletLoading } = useEmbeddedEvmWalletContext();
    const { data: walletClient } = useWalletClient({
        connector: connectors.find((item) => item.id === PRIVY_CONNECTOR_ID),
    });
    const { withdrawable, isQueryPending: isAccountLoading } = usePerpsComputedAccountValue(address ?? undefined);
    const { isBlocked, isLoading: isGeoblockLoading } = useIsPerpsBlocked();
    const validation = useMemo(() => {
        const value = BigNumber(amount || '0');
        if (!value.isPositive()) return 'amount-required';
        if (value.isLessThan(MINIMUM_WITHDRAWAL)) return 'below-minimum';
        if (value.isGreaterThan(withdrawable || '0')) return 'insufficient-balance';
        return null;
    }, [amount, withdrawable]);

    const mutation = useMutation({
        mutationFn: () =>
            withSkipPinCodeCheck(async () => {
                if (!walletClient || !address) throw new Error('Wallet is unavailable.');
                if (isBlocked) throw new Error('Perpetuals are unavailable in this region.');
                if (validation) throw new Error(validation);
                const client = createPerpsClient();
                try {
                    await client.createExchangeClient(walletClient).withdraw3({ destination: address, amount });
                } finally {
                    await client.close();
                }
            }),
        async onSuccess() {
            await invalidatePerpsQueries(queryClient);
            publishResult('success');
            toast.success(<Trans>Withdrawal submitted.</Trans>);
        },
        onError(error) {
            publishResult('failed');
            toast.error(<Trans>Withdrawal failed.</Trans>, {
                description: error instanceof Error ? error.message : undefined,
            });
        },
    });

    const buttonLabel =
        validation === 'below-minimum' ? (
            <Trans>Minimum {MINIMUM_WITHDRAWAL} USDC</Trans>
        ) : validation === 'insufficient-balance' ? (
            <Trans>Insufficient Balance</Trans>
        ) : (
            <Trans>Withdraw</Trans>
        );
    const isLoading = isWalletLoading || isAccountLoading || isGeoblockLoading;
    const hasAmount = new BigNumber(amount || '0').isPositive();
    const isInsufficient = validation === 'insufficient-balance';
    const handleAmountChange = (value: string) => {
        setAmount(normalizeDecimalInput(value.replaceAll(',', ''), { maxDecimals: 6 }));
    };

    const selectPercentage = (percentage: number) => {
        const available = new BigNumber(withdrawable || '0');
        if (!available.isFinite() || available.isNegative()) return;
        setAmount(available.multipliedBy(percentage).dividedBy(100).decimalPlaces(6, BigNumber.ROUND_DOWN).toFixed());
    };

    return (
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white text-lightTextMain dark:bg-neutral-950 dark:text-neutral-50">
            <NavigationBar className="shrink-0 font-[Poppins] leading-6" backIcon={<BackIcon className="size-6" />}>
                <Trans>Withdraw</Trans>
            </NavigationBar>

            <form
                className="flex min-h-0 flex-1 flex-col justify-between"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (!isLoading && !validation && !mutation.isPending && !isBlocked) mutation.mutate();
                }}
            >
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
                    <label htmlFor="perps-withdraw-amount" className="sr-only">
                        <Trans>Amount</Trans>
                    </label>
                    <input
                        id="perps-withdraw-amount"
                        inputMode="decimal"
                        value={`$${formatInputAmount(amount)}`}
                        className={cn(
                            'h-10 w-full appearance-none border-0 bg-transparent p-0 text-center text-[40px] font-bold leading-10 text-lightTextMain shadow-none outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 dark:text-neutral-50',
                            isInsufficient && 'text-[#ff372b] dark:text-[#ff372b]',
                        )}
                        onChange={(event) => handleAmountChange(event.target.value)}
                    />
                    <p className="mt-2 text-xs font-medium leading-3 text-[#767676]">
                        {isAccountLoading ? '--' : formatAvailable(withdrawable)} <Trans>available</Trans>
                    </p>
                </div>

                <div className="flex shrink-0 flex-col gap-4 p-4">
                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                            <div className="relative size-9 shrink-0">
                                <UsdcIcon className="size-9" />
                                <ChainIcon
                                    chainId={ARBITRUM_CHAIN_ID}
                                    size={16}
                                    className="absolute -bottom-px right-[-3px] border border-white dark:border-neutral-950"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="text-sm font-semibold leading-[14px]">
                                    <Trans>Receive</Trans>
                                </div>
                                <span className="text-xs font-medium leading-3 text-[#767676]">
                                    <Trans>in your Firefly wallet</Trans>
                                </span>
                            </div>
                        </div>
                        <strong className="text-sm font-semibold leading-[14px]">
                            {formatReceiveAmount(amount)} USDC
                        </strong>
                    </div>

                    <div className="flex items-center justify-between">
                        {PERCENTAGES.map((percentage) => (
                            <button
                                key={percentage}
                                type="button"
                                className="h-8 min-w-[69px] rounded-2xl bg-[#f5f5f9] px-4 text-base font-semibold leading-6 dark:bg-neutral-900"
                                onClick={() => selectPercentage(percentage)}
                            >
                                {percentage}%
                            </button>
                        ))}
                        <button
                            type="button"
                            className="h-8 min-w-[65px] rounded-2xl bg-[#f5f5f9] px-4 text-base font-semibold leading-6 dark:bg-neutral-900"
                            onClick={() => setAmount(withdrawable || '0')}
                        >
                            <Trans>Max</Trans>
                        </button>
                    </div>

                    {isBlocked ? (
                        <p
                            role="alert"
                            className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400"
                        >
                            <Trans>This feature is currently unavailable in your region.</Trans>
                        </p>
                    ) : null}

                    <div className="flex flex-col gap-4">
                        <button
                            type="submit"
                            disabled={isLoading || Boolean(validation) || mutation.isPending || isBlocked}
                            className="h-12 w-full rounded-full bg-lightTextMain text-base font-bold leading-6 text-white disabled:cursor-not-allowed disabled:bg-[#d8d7e1] disabled:text-[#a9a6bc] dark:bg-neutral-50 dark:text-neutral-950 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500"
                        >
                            {mutation.isPending ? <Trans>Submitting…</Trans> : buttonLabel}
                        </button>
                        <button
                            type="button"
                            className="mx-auto flex items-center gap-1 text-xs font-medium leading-3 text-[#767676]"
                            onClick={() => setShowServiceFee(true)}
                        >
                            <span>
                                <Trans>Withdrawal fee:</Trans>${hasAmount ? EXECUTION_FEE : '0'}
                            </span>
                            <InfoIcon className="size-3.5" />
                        </button>
                    </div>
                </div>
            </form>

            <Drawer open={showServiceFee} onOpenChange={setShowServiceFee}>
                <DrawerContent
                    className="mx-auto max-w-[800px] rounded-t-2xl"
                    bodyClassName="gap-6 overflow-visible px-6 pb-6 pt-6"
                >
                    <DrawerTitle className="flex flex-none items-center gap-2 self-stretch text-left font-[Poppins] text-xl font-semibold leading-6 first:mr-0">
                        <ServiceInfoIcon className="size-6" />
                        <Trans>Withdrawal fee</Trans>
                    </DrawerTitle>
                    <DrawerDescription className="text-base font-medium leading-5 text-lightTextMain dark:text-neutral-50">
                        <Trans>
                            Hyperliquid charges a fixed {EXECUTION_FEE} USDC withdrawal fee to cover Arbitrum gas costs.
                        </Trans>
                    </DrawerDescription>
                    <button
                        type="button"
                        className="h-12 w-full rounded-full bg-lightTextMain text-base font-bold leading-6 text-white dark:bg-neutral-50 dark:text-neutral-950"
                        onClick={() => setShowServiceFee(false)}
                    >
                        <Trans>Done</Trans>
                    </button>
                </DrawerContent>
            </Drawer>
        </div>
    );
}
