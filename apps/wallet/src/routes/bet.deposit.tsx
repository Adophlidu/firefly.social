import ArrowDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import SwitchIcon from '@dimensiondev/assets/switch.svg';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { BigNumber } from 'bignumber.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatUnits } from 'viem';
import { polygon } from 'viem/chains';

import { BetError } from '@/components/Bet/BetError.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingPanel } from '@/components/LoadingPanel.js';
import { NavigationBar } from '@/components/NavigationBar.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { Button } from '@/components/ui/button.js';
import { SwapFromPage } from '@/constants/enum.js';
import { formatTokenItemAmount } from '@/helpers/formatTokenItemAmount.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { isSolanaChain } from '@/helpers/isSolanaChain.js';
import { dividedBy, isLessThan, multipliedBy, toFixed } from '@/helpers/number.js';
import { addressesMatch } from '@/helpers/swap/formatSwapAmount.js';
import { useAddFunds } from '@/hooks/bet/useAddFunds.js';
import { usdcTokenFallback, useDepositToken } from '@/hooks/bet/useTokenDetail.js';
import { useSwapQuoteCore } from '@/hooks/swap/useSwapQuoteCore.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { useDecimalInput } from '@/hooks/useDecimalInput.js';
import { cn } from '@/lib/utils.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export const Route = createFileRoute('/bet/deposit')({
    component: DepositPage,
    pendingComponent: LoadingPanel,
    errorComponent: BetError,
});

const MINIMUM_USD = 1;
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
    const navigate = useNavigate();
    const isSubmittingRef = useRef(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [value, setValue] = useState('');
    const [inputType, setInputType] = useState(InputType.Usdc);

    const { inputProps } = useDecimalInput({ value, onValueChange: setValue, maxDecimals: 2 });
    const { evmAddress, solanaAddress, isLoading: isEmbeddedWalletLoading } = useEmbeddedWalletAddresses();
    const { token: depositToken, isLoading: isDepositTokenLoading, isBalanceLoading } = useDepositToken();
    const { data: polymarketAccount, isLoading: isPolymarketAccountLoading } = useQuery({
        queryKey: ['polymarket-account'],
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: async () => {
            const account = await getFireflyEndpoint().createPolymarketAccount();
            return account;
        },
    });

    const isSameToken =
        depositToken?.chainId === usdcTokenFallback.chainId &&
        addressesMatch(depositToken.address, usdcTokenFallback.address);
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
                usdcValue: value
                    ? toFixed(multipliedBy(value, depositToken.price ?? 0), usdcTokenFallback.decimals)
                    : '0',
            };

        return {
            amount: value ? toFixed(dividedBy(value, depositToken.price ?? 1), depositToken.decimals) : '0',
            usdcValue: value,
        };
    }, [value, inputType, depositToken, isSameToken]);

    const embeddedAddress = !depositToken ? null : isSolanaChain(depositToken.chainId) ? solanaAddress : evmAddress;
    const { quote, isLoading: isQuoteLoading } = useSwapQuoteCore({
        fromToken: depositToken,
        toToken: usdcTokenFallback,
        fromAmount: amount,
        slippage: 'auto',
        fromChainId: depositToken?.chainId ?? null,
        toChainId: usdcTokenFallback.chainId,
        walletAddress: embeddedAddress,
        recipientAddress: polymarketAccount?.proxyAddress ?? null,
        enabled: !!depositToken && !!embeddedAddress && !isSameToken,
    });

    const isInsufficientGas = useMemo(() => {
        if (!quote || !('gasEstimate' in quote) || !quote.gasEstimate || !depositToken) return false;
        // For native tokens (ETH, SOL, etc.), check if balance minus swap amount covers gas
        if (
            depositToken.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ||
            depositToken.address === 'So11111111111111111111111111111111111111112'
        ) {
            const balanceNum = parseFloat(depositToken.balance || '0');
            const amountNum = parseFloat(amount || '0');
            const gasEstimate = parseFloat(quote.gasEstimate);
            // Rough estimate: if remaining balance after swap < 10x gas estimate, likely insufficient
            return balanceNum - amountNum < gasEstimate * 0.001;
        }
        return false;
    }, [quote, depositToken, amount]);

    const isInsufficientBalance = depositToken ? isLessThan(depositToken.balance, amount) : false;
    const isLessThanMinimum = isLessThan(usdcValue, MINIMUM_USD);
    const disabled =
        !value ||
        isInsufficientBalance ||
        isLessThanMinimum ||
        !depositToken ||
        isDepositTokenLoading ||
        isInsufficientGas ||
        isQuoteLoading;
    const buttonLabel = useMemo(() => {
        if (isLessThanMinimum) {
            return <Trans>Minimum $1.00</Trans>;
        }
        if (isInsufficientGas) {
            return <Trans>Insufficient Gas</Trans>;
        }
        return <Trans>Add Funds</Trans>;
    }, [isLessThanMinimum, isInsufficientGas]);

    const { mutateAsync, isPending } = useAddFunds({
        depositToken: depositToken ?? undefined,
        polymarketAddress: polymarketAccount?.proxyAddress,
        amount,
        toastId: TOAST_ID,
        onSettled: () => {
            isSubmittingRef.current = false;
        },
    });

    const handleTokenClick = useCallback(() => {
        navigate({ to: '/swap/select-token', search: { side: 'pay', from: SwapFromPage.BetDeposit } });
    }, [navigate]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    if (isEmbeddedWalletLoading || !embeddedAddress || isPolymarketAccountLoading) {
        return <LoadingPanel />;
    }

    const usdcBalanceUsdText = formatTokenUSD(isSameToken ? usdcValue : (quote?.toAmount ?? '0'), { minDisplay: 0.01 });

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
                <div className="flex h-[60px] w-full items-center gap-3" onClick={handleTokenClick}>
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
                        setValue(inputType === InputType.Amount ? usdcValue : amount);
                        setInputType((perv) => (perv === InputType.Amount ? InputType.Usdc : InputType.Amount));
                    }}
                >
                    {depositToken && !isSameToken ? (
                        <>
                            <TokenIcon
                                size={14}
                                icon={inputType === InputType.Amount ? usdcTokenFallback.logoUrl : depositToken.logoUrl}
                            />
                            <span className="text-second text-xs leading-[14px]">
                                {inputType === InputType.Amount ? formatTokenUSD(usdcValue) : amount}
                            </span>
                            <SwitchIcon width={14} height={14} className="rotate-90" />
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
                        icon="https://coin-images.coingecko.com/coins/images/6319/large/usdc.png"
                        symbol="USDC.e"
                        name="USD Coin"
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
                                const newAmount =
                                    rate === 1
                                        ? depositToken.balance
                                        : formatUnits(ratedValueBigInt, depositToken.decimals);
                                setValue(
                                    inputType === InputType.Amount
                                        ? toFixed(newAmount, depositToken.decimals)
                                        : toFixed(
                                              multipliedBy(newAmount, depositToken.price ?? 0),
                                              usdcTokenFallback.decimals,
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
