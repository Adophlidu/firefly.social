import { removeTrailingZeros } from '@dimensiondev/utils';
import { isLessThan, multipliedBy } from '@dimensiondev/web3/numbers';
import { Trans } from '@lingui/react/macro';
import { createFileRoute } from '@tanstack/react-router';
import { BigNumber } from 'bignumber.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { BetLoadFailed } from '@/components/Bet/BetLoadFailed.js';
import { LoadingPanel } from '@/components/LoadingPanel.js';
import { NavigationBar } from '@/components/NavigationBar.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { Button } from '@/components/ui/button.js';
import { useComeback } from '@/components/useComeback.js';
import {
    ARBITRUM_CHAIN_ID,
    ARBITRUM_USDC_ADDRESS,
    ARBITRUM_USDC_DECIMALS,
    MIN_HYPERLIQUID_DEPOSIT_USDC,
} from '@/constants/hyperliquid.js';
import { formatTokenItemAmount } from '@/helpers/formatTokenItemAmount.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { getUserFacingErrorMessage } from '@/helpers/getErrorMessage.js';
import { useCheckGasForPerpsArbUsdcDeposit } from '@/hooks/perps/useCheckGasForPerpsArbUsdcDeposit.js';
import { useDepositArbitrumUsdcToHyperliquid } from '@/hooks/perps/useDepositArbitrumUsdcToHyperliquid.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { useDecimalInput } from '@/hooks/useDecimalInput.js';
import { useTokenBalance } from '@/hooks/useTokenBalance.js';
import { cn } from '@/lib/utils.js';

export const Route = createFileRoute('/perps/deposit')({
    component: PerpsDepositPage,
    pendingComponent: LoadingPanel,
    errorComponent: ({ reset }) => <BetLoadFailed reset={reset} />,
});

const TOAST_ID = 'perps-hyperliquid-deposit';

function PerpsDepositPage() {
    return (
        <div className="flex min-h-0 w-full flex-1 flex-col">
            <NavigationBar>
                <Trans>Add Funds</Trans>
            </NavigationBar>
            <PerpsDepositClient />
        </div>
    );
}

function PerpsDepositClient() {
    const isSubmittingRef = useRef(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [value, setValue] = useState('');
    const comeback = useComeback('/perps');

    const { evmAddress, isLoading: isEmbeddedWalletLoading, isPrivyReady } = useEmbeddedWalletAddresses();
    const { inputProps } = useDecimalInput({ value, onValueChange: setValue, maxDecimals: ARBITRUM_USDC_DECIMALS });

    const { data: usdcToken, isLoading: isBalanceLoading } = useTokenBalance({
        walletAddress: evmAddress,
        address: ARBITRUM_USDC_ADDRESS,
        chainId: ARBITRUM_CHAIN_ID,
    });

    const amount = value || '0';
    const { isInsufficientGas, isLoading: isGasLoading } = useCheckGasForPerpsArbUsdcDeposit({
        amount,
        walletAddress: evmAddress,
    });

    const isInsufficientBalance = usdcToken ? isLessThan(usdcToken.balance ?? '0', amount) : false;
    const isLessThanMinimum = isLessThan(amount, String(MIN_HYPERLIQUID_DEPOSIT_USDC));
    const disabled =
        !value ||
        isInsufficientBalance ||
        isLessThanMinimum ||
        isInsufficientGas ||
        isGasLoading ||
        !usdcToken ||
        isBalanceLoading;

    const buttonLabel = useMemo(() => {
        if (isInsufficientBalance) {
            return <Trans>Insufficient Balance</Trans>;
        }
        if (isInsufficientGas) {
            return <Trans>Insufficient Gas</Trans>;
        }
        if (isLessThanMinimum && value) {
            return <Trans>Minimum {MIN_HYPERLIQUID_DEPOSIT_USDC} USDC</Trans>;
        }
        return <Trans>Add Funds</Trans>;
    }, [isLessThanMinimum, isInsufficientGas, isInsufficientBalance, value]);

    const { mutateAsync, isPending } = useDepositArbitrumUsdcToHyperliquid({
        toastId: TOAST_ID,
        onSettled: () => {
            isSubmittingRef.current = false;
        },
    });

    useEffect(() => {
        inputRef.current?.focus();
        return () => {
            toast.dismiss(TOAST_ID);
        };
    }, []);

    if (isEmbeddedWalletLoading || !evmAddress || !isPrivyReady) {
        return <LoadingPanel />;
    }

    const receivedUsdText = formatTokenUSD(amount, { minDisplay: 0.01 });

    return (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center px-4">
            <div className="flex h-[60px] w-full items-center gap-3">
                <TokenIcon
                    size={36}
                    badgeSize={16}
                    className="shrink-0"
                    badgeClassName="bg-white"
                    chainId={ARBITRUM_CHAIN_ID}
                    icon={usdcToken?.logoURI}
                    symbol="USDC"
                    name="USD Coin"
                />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                        <span className="text-main text-sm font-semibold">USDC</span>
                    </div>
                    {isBalanceLoading ? (
                        <div className="bg-lightBg h-[14px] w-8 animate-pulse" />
                    ) : (
                        <span className="text-second text-xs font-medium">
                            <Trans>
                                {formatTokenItemAmount(usdcToken?.balance ?? '0')} USDC in your Firefly wallet
                            </Trans>
                        </span>
                    )}
                </div>
                {isBalanceLoading ? (
                    <div className="bg-lightBg h-5 w-7 animate-pulse" />
                ) : (
                    <span className="text-main shrink-0 text-sm font-semibold">
                        {usdcToken?.balance
                            ? formatTokenUSD(multipliedBy(usdcToken.balance, usdcToken.price ?? 1).toString())
                            : '$0'}
                    </span>
                )}
            </div>

            <label
                className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-2"
                htmlFor="perps-deposit-amount"
            >
                <input
                    id="perps-deposit-amount"
                    {...inputProps}
                    value={inputProps.value ? `$${inputProps.value}` : inputProps.value}
                    autoComplete="off"
                    ref={inputRef}
                    autoFocus
                    className={cn(
                        'h-10 w-full border-none text-center text-[40px] font-bold leading-10 outline-none focus:outline-none focus:ring-0',
                        {
                            'text-danger': isInsufficientBalance,
                        },
                    )}
                    placeholder="$0"
                />
            </label>

            <div className="w-full space-y-4 pb-4">
                <div className="flex h-[60px] w-full items-center">
                    <TokenIcon
                        size={36}
                        badgeSize={16}
                        className="shrink-0"
                        badgeClassName="bg-white"
                        chainId={ARBITRUM_CHAIN_ID}
                        icon={usdcToken?.logoURI}
                        symbol="USDC"
                        name="USD Coin"
                    />
                    <div className="ml-4 flex w-full min-w-0 flex-col justify-start text-left">
                        <div className="h-5 w-full truncate text-sm font-semibold">
                            <Trans>Receive</Trans>
                        </div>
                        <div className="text-second w-full text-xs font-medium leading-3">
                            <Trans>into your perps account</Trans>
                        </div>
                    </div>
                    {isGasLoading && value ? (
                        <div className="bg-lightBg ml-auto h-5 w-10 animate-pulse" />
                    ) : (
                        <div className="ml-auto text-sm font-semibold">{receivedUsdText || '-'}</div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-4">
                    {[0.25, 0.5, 0.75, 1].map((rate) => (
                        <button
                            key={rate}
                            type="button"
                            className="bg-lightBg active:bg-main/10 h-8 w-[70px] rounded-full text-center font-semibold leading-8 duration-75 active:scale-95"
                            onClick={() => {
                                if (!usdcToken?.balance) return;
                                const maxBn = BigNumber(usdcToken.balance);
                                const portion = maxBn
                                    .times(Math.min(rate, 0.95))
                                    .decimalPlaces(ARBITRUM_USDC_DECIMALS, BigNumber.ROUND_DOWN);
                                setValue(removeTrailingZeros(portion.toFixed()));
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
                    disabled={disabled || isPending}
                    loading={isPending}
                    onClick={() => {
                        if (isSubmittingRef.current || isPending) return;
                        isSubmittingRef.current = true;
                        void mutateAsync(amount)
                            .then(() => {
                                toast.dismiss(TOAST_ID);
                                toast.success(
                                    <Trans>Deposit submitted. Funds will appear on Hyperliquid shortly.</Trans>,
                                );
                                comeback();
                            })
                            .catch((error: unknown) => {
                                toast.dismiss(TOAST_ID);
                                const { message: userHint, details } = getUserFacingErrorMessage(error);
                                toast.error(<Trans>Deposit failed.</Trans>, { description: userHint || details });
                            });
                    }}
                >
                    {buttonLabel}
                </Button>
            </div>
        </div>
    );
}
