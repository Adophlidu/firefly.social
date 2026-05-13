import ArrowDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import BetSwitchIcon from '@dimensiondev/assets/bet-exchange.svg';
import { removeTrailingZeros } from '@dimensiondev/utils';
import { isSolanaChain } from '@dimensiondev/web3/chains';
import { dividedBy, isLessThan, multipliedBy, toFixed } from '@dimensiondev/web3/numbers';
import { isNativeTokenOrSameAddress } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { BigNumber } from 'bignumber.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { formatUnits } from 'viem';
import { polygon } from 'viem/chains';

import { BetError } from '@/components/Bet/BetError.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingPanel } from '@/components/LoadingPanel.js';
import { NavigationBar } from '@/components/NavigationBar.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { Button } from '@/components/ui/button.js';
import { SwapFromPage } from '@/constants/enum.js';
import { BET_DEPOSIT_MIN_USD } from '@/constants/static.js';
import { formatTokenItemAmount } from '@/helpers/formatTokenItemAmount.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { useAddFunds } from '@/hooks/bet/useAddFunds.js';
import { useCheckGasForDeposit } from '@/hooks/bet/useCheckGasForDeposit.js';
import { pusdTokenFallback, useDepositToken } from '@/hooks/bet/useTokenDetail.js';
import { useGoToSelectToken } from '@/hooks/swap/useGoToSelectToken.js';
import { useSwapQuoteCore } from '@/hooks/swap/useSwapQuoteCore.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { useDecimalInput } from '@/hooks/useDecimalInput.js';
import { cn } from '@/lib/utils.js';
import { getPolymarketWithdrawSupportedTokensQueryOptions } from '@/queries/firefly/getPolymarketWithdrawSupportedTokensQueryOptions.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export const Route = createFileRoute('/bet/deposit')({
    component: DepositPage,
    pendingComponent: LoadingPanel,
    errorComponent: BetError,
});

const TOAST_ID = 'polymarket-deposit';

enum InputType {
    Amount = 'amount',
    Usdc = 'usdc',
}

function DepositPage() {
    return (
        <>
            <NavigationBar>
                <Trans>Add Funds</Trans>
            </NavigationBar>
            <DepositClient />
        </>
    );
}

function DepositClient() {
    const isSubmittingRef = useRef(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [value, setValue] = useState('');
    const [inputType, setInputType] = useState(InputType.Usdc);

    const {
        token: depositToken,
        isLoading: isDepositTokenLoading,
        isBalanceLoading,
        isDefaultTokenLoading,
    } = useDepositToken();

    const { data: supportedTokens } = useQuery(getPolymarketWithdrawSupportedTokensQueryOptions());

    const minCheckoutUsd = useMemo(() => {
        if (!supportedTokens || !depositToken) return BET_DEPOSIT_MIN_USD;
        const match = supportedTokens.find(
            (t) =>
                t.token_address.toLowerCase() === (depositToken.address ?? '').toLowerCase() &&
                t.chain_id === depositToken.chainId,
        );
        return match?.min_checkout_usd ?? BET_DEPOSIT_MIN_USD;
    }, [supportedTokens, depositToken]);

    const maxDecimals = inputType === InputType.Amount && depositToken ? depositToken.decimals : 2;
    const { inputProps } = useDecimalInput({ value, onValueChange: setValue, maxDecimals });
    const { evmAddress, solanaAddress, isLoading: isEmbeddedWalletLoading } = useEmbeddedWalletAddresses();
    const { data: polymarketAccount, isLoading: isPolymarketAccountLoading } = useQuery({
        queryKey: ['polymarket-account'],
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: async () => {
            const account = await getFireflyEndpoint().createPolymarketAccount();
            return account;
        },
    });

    const isSameToken =
        depositToken?.chainId === pusdTokenFallback.chainId &&
        isNativeTokenOrSameAddress(depositToken.address, pusdTokenFallback.address);
    const { amount, usdcValue } = useMemo(() => {
        if (!depositToken)
            return {
                amount: '0',
                usdcValue: '0',
            };
        if (isSameToken)
            return {
                amount: value,
                usdcValue: value,
            };

        if (inputType === InputType.Amount)
            return {
                amount: value,
                usdcValue: removeTrailingZeros(value ? toFixed(multipliedBy(value, depositToken.price ?? 0), 2) : '0'),
            };

        return {
            amount: removeTrailingZeros(
                value ? toFixed(dividedBy(value, depositToken.price ?? 1), depositToken.decimals) : '0',
            ),
            usdcValue: value,
        };
    }, [value, inputType, depositToken, isSameToken]);

    const embeddedAddress = !depositToken ? null : isSolanaChain(depositToken.chainId) ? solanaAddress : evmAddress;
    const { quote, isLoading: isQuoteLoading } = useSwapQuoteCore({
        fromToken: depositToken,
        toToken: pusdTokenFallback,
        fromAmount: amount,
        slippage: 'auto',
        fromChainId: depositToken?.chainId ?? null,
        toChainId: pusdTokenFallback.chainId,
        walletAddress: embeddedAddress,
        recipientAddress: polymarketAccount?.proxyAddress ?? null,
        enabled: !!depositToken && !!embeddedAddress && !isSameToken,
    });
    const { isInsufficientGas, isLoading: isGasLoading } = useCheckGasForDeposit({
        depositToken,
        amount,
        quote,
    });

    const isInsufficientBalance = depositToken ? isLessThan(depositToken.balance, amount) : false;
    const receivedUsdc = isSameToken ? usdcValue : (quote?.toAmount ?? '0');
    const isLessThanMinimum = isLessThan(receivedUsdc, minCheckoutUsd);
    const disabled =
        !value ||
        isInsufficientBalance ||
        isLessThanMinimum ||
        !depositToken ||
        isDepositTokenLoading ||
        isInsufficientGas ||
        isQuoteLoading ||
        isGasLoading;
    const buttonLabel = useMemo(() => {
        if (isInsufficientBalance) {
            return <Trans>Insufficient Balance</Trans>;
        }
        if (isInsufficientGas) {
            return <Trans>Insufficient Gas</Trans>;
        }
        if (isLessThanMinimum) {
            return <Trans>Minimum ${minCheckoutUsd.toFixed(2)}</Trans>;
        }
        return <Trans>Add Funds</Trans>;
    }, [isLessThanMinimum, isInsufficientGas, isInsufficientBalance, minCheckoutUsd]);

    const { mutateAsync, isPending } = useAddFunds({
        depositToken: depositToken ?? undefined,
        polymarketAddress: polymarketAccount?.proxyAddress,
        amount,
        toastId: TOAST_ID,
        onSettled: () => {
            isSubmittingRef.current = false;
        },
    });

    const goToSelectToken = useGoToSelectToken({
        side: 'pay',
        from: SwapFromPage.BetDeposit,
    });

    useEffect(() => {
        inputRef.current?.focus();

        return () => {
            toast.dismiss();
        };
    }, []);

    if (isEmbeddedWalletLoading || !embeddedAddress || isPolymarketAccountLoading || isDefaultTokenLoading) {
        return <LoadingPanel />;
    }

    const usdcBalanceUsdText = formatTokenUSD(receivedUsdc, { minDisplay: 0.01 });

    return (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center px-4">
            {!depositToken || isDepositTokenLoading ? (
                <div className="flex h-[60px] w-full items-center gap-3">
                    <div className="bg-lightBg size-9 rounded-full" />
                    <div className="flex-1">
                        <div className="bg-lightBg h-5 w-[50px]" />
                        <div className="bg-lightBg mt-1 h-3 w-[100px]" />
                    </div>
                    <div className="bg-lightBg h-5 w-7" />
                </div>
            ) : (
                <div className="flex h-[60px] w-full cursor-pointer items-center gap-3" onClick={goToSelectToken}>
                    <TokenIcon
                        size={36}
                        badgeSize={16}
                        className="shrink-0"
                        badgeClassName="bg-white"
                        chainId={depositToken.chainId}
                        icon={depositToken.logoUrl}
                        symbol={depositToken.symbol}
                        name={depositToken.name}
                    />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                            <span className="text-main text-sm font-semibold">{depositToken.name}</span>
                            <ArrowDownIcon width={16} height={16} />
                        </div>
                        {isBalanceLoading ? (
                            <div className="bg-lightBg h-[14px] w-8 animate-pulse" />
                        ) : (
                            <span className="text-second text-xs font-medium">
                                <Trans>
                                    {formatTokenItemAmount(depositToken.balance ?? '0')} {depositToken.symbol} in your
                                    Firefly wallet
                                </Trans>
                            </span>
                        )}
                    </div>
                    {isBalanceLoading ? (
                        <div className="bg-lightBg h-5 w-7 animate-pulse" />
                    ) : (
                        <span className="text-main shrink-0 text-sm font-semibold">
                            {depositToken.balance
                                ? formatTokenUSD(multipliedBy(depositToken.balance, depositToken.price ?? 0).toString())
                                : '$0'}
                        </span>
                    )}
                </div>
            )}
            <label
                className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-2"
                htmlFor="deposit-amount"
            >
                <input
                    id="deposit-amount"
                    {...inputProps}
                    value={inputType === InputType.Usdc && inputProps.value ? `$${inputProps.value}` : inputProps.value}
                    autoComplete="off"
                    ref={inputRef}
                    autoFocus
                    className={cn(
                        'h-10 w-full border-none text-center text-[40px] font-bold leading-10 outline-none focus:outline-none focus:ring-0',
                        {
                            'text-danger': isInsufficientBalance,
                        },
                    )}
                    placeholder={inputType === InputType.Amount ? '0' : '$0'}
                />
                <ClickableButton
                    className="flex h-3.5 items-center gap-1"
                    onClick={() => {
                        if (!depositToken || isSameToken) return;

                        setValue(removeTrailingZeros(inputType === InputType.Amount ? usdcValue : amount));
                        setInputType((perv) => (perv === InputType.Amount ? InputType.Usdc : InputType.Amount));
                    }}
                >
                    {depositToken && !isSameToken ? (
                        <>
                            <TokenIcon
                                size={14}
                                icon={inputType === InputType.Amount ? pusdTokenFallback.logoUrl : depositToken.logoUrl}
                            />
                            <span className="text-second text-xs leading-[14px]">
                                {inputType === InputType.Amount ? formatTokenUSD(usdcValue) : amount}
                            </span>
                            <BetSwitchIcon width={14} height={14} />
                        </>
                    ) : null}
                </ClickableButton>
            </label>
            <div className="w-full space-y-4 pb-4">
                <div className="flex h-[60px] w-full items-center">
                    <TokenIcon
                        size={36}
                        badgeSize={16}
                        className="shrink-0"
                        badgeClassName="bg-white"
                        chainId={polygon.id}
                        icon={pusdTokenFallback.logoUrl}
                        symbol={pusdTokenFallback.symbol}
                        name={pusdTokenFallback.name}
                    />
                    <div className="ml-4 flex w-full min-w-0 flex-col justify-start text-left">
                        <div className="h-5 w-full truncate text-sm font-semibold">
                            <Trans>Receive</Trans>
                        </div>
                        <div className="text-second w-full text-xs font-medium leading-3">
                            <Trans>into your predict wallet</Trans>
                        </div>
                    </div>
                    {isQuoteLoading ? (
                        <div className="bg-lightBg ml-auto h-5 w-10 animate-pulse" />
                    ) : (
                        <div className="ml-auto text-sm font-semibold">{usdcBalanceUsdText || '-'}</div>
                    )}
                </div>
                <div className="flex items-center justify-between gap-4">
                    {[0.25, 0.5, 0.75, 1].map((rate) => (
                        <button
                            key={rate}
                            className="bg-lightBg active:bg-main/10 h-8 w-[70px] rounded-full text-center font-semibold leading-8 duration-75 active:scale-95"
                            onClick={() => {
                                if (!depositToken) return;

                                const ratedValueBigInt = BigInt(
                                    BigNumber(depositToken.rawAmount).times(rate).toFixed(0),
                                );
                                const newAmount = formatUnits(ratedValueBigInt, depositToken.decimals);
                                setValue(
                                    removeTrailingZeros(
                                        inputType === InputType.Amount
                                            ? toFixed(newAmount, maxDecimals)
                                            : toFixed(multipliedBy(newAmount, depositToken.price ?? 0), maxDecimals),
                                    ),
                                );
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
                        mutateAsync();
                    }}
                >
                    {buttonLabel}
                </Button>
            </div>
        </div>
    );
}
