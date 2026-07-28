import { SwapFromPage } from '@dimensiondev/enums';
import { removeTrailingZeros } from '@dimensiondev/utils';
import { isSolanaChain } from '@dimensiondev/web3/chains';
import { isLessThan } from '@dimensiondev/web3/numbers';
import { Trans } from '@lingui/react/macro';
import { createFileRoute } from '@tanstack/react-router';
import { BigNumber } from 'bignumber.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { BetLoadFailed } from '@/components/Bet/BetLoadFailed.js';
import { DepositAmountField } from '@/components/Deposit/DepositAmountField.js';
import { DepositFormFooter } from '@/components/Deposit/DepositFormFooter.js';
import { DepositPayTokenRow } from '@/components/Deposit/DepositPayTokenRow.js';
import { DepositReceiveRow } from '@/components/Deposit/DepositReceiveRow.js';
import { LoadingPanel } from '@/components/LoadingPanel.js';
import { NavigationBar } from '@/components/NavigationBar.js';
import {
    ARBITRUM_CHAIN_ID,
    arbUsdcTokenFallback,
    HYPERLIQUID_CHAIN_ID,
    isArbitrumUsdcToken,
    MIN_HYPERLIQUID_DEPOSIT_USDC,
} from '@/constants/hyperliquid.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { useCheckGasForDeposit } from '@/hooks/bet/useCheckGasForDeposit.js';
import { DepositAmountInputType } from '@/hooks/deposit/depositAmountInputType.js';
import { useDepositAmountConversion } from '@/hooks/deposit/useDepositAmountConversion.js';
import { useCheckGasForPerpsArbUsdcDeposit } from '@/hooks/perps/useCheckGasForPerpsArbUsdcDeposit.js';
import { useDepositToHyperliquid } from '@/hooks/perps/useDepositToHyperliquid.js';
import { usePerpsDepositToken } from '@/hooks/perps/usePerpsDepositToken.js';
import { useGoToSelectToken } from '@/hooks/swap/useGoToSelectToken.js';
import { useSwapQuoteCore } from '@/hooks/swap/useSwapQuoteCore.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { useDecimalInput } from '@/hooks/useDecimalInput.js';

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
    const [inputType, setInputType] = useState(DepositAmountInputType.Usd);

    const {
        token: depositToken,
        isLoading: isDepositTokenLoading,
        isBalanceLoading,
        isDefaultTokenLoading,
        receiveToken,
    } = usePerpsDepositToken();

    const maxDecimals = inputType === DepositAmountInputType.Amount && depositToken ? depositToken.decimals : 2;
    const { inputProps } = useDecimalInput({ value, onValueChange: setValue, maxDecimals });
    const {
        evmAddress,
        solanaAddress,
        isLoading: isEmbeddedWalletLoading,
        isPrivyReady,
    } = useEmbeddedWalletAddresses();

    const isSameToken = depositToken ? isArbitrumUsdcToken(depositToken.chainId, depositToken.address) : false;
    const { amount, usdValue } = useDepositAmountConversion({
        value,
        inputType,
        depositToken,
        isSameAsReceiveToken: isSameToken,
    });

    const embeddedAddress = !depositToken ? null : isSolanaChain(depositToken.chainId) ? solanaAddress : evmAddress;
    const { quote, isLoading: isQuoteLoading } = useSwapQuoteCore({
        fromToken: depositToken,
        toToken: receiveToken,
        fromAmount: amount,
        slippage: 'auto',
        fromChainId: depositToken?.chainId ?? null,
        toChainId: HYPERLIQUID_CHAIN_ID,
        walletAddress: embeddedAddress,
        recipientAddress: evmAddress,
        enabled: !!depositToken && !!embeddedAddress && !isSameToken,
    });

    const { isInsufficientGas: isSwapGasInsufficient, isLoading: isSwapGasLoading } = useCheckGasForDeposit({
        depositToken,
        amount,
        quote: isSameToken ? null : quote,
    });
    const { isInsufficientGas: isTransferGasInsufficient, isLoading: isTransferGasLoading } =
        useCheckGasForPerpsArbUsdcDeposit({
            amount,
            walletAddress: evmAddress,
            enabled: isSameToken,
        });

    const isInsufficientGas = isSameToken ? isTransferGasInsufficient : isSwapGasInsufficient;
    const isGasLoading = isSameToken ? isTransferGasLoading : isSwapGasLoading;

    const isInsufficientBalance = depositToken ? isLessThan(depositToken.balance ?? '0', amount) : false;
    const receivedUsdc = isSameToken ? usdValue : (quote?.toAmount ?? '0');
    const isLessThanMinimum = isLessThan(receivedUsdc, String(MIN_HYPERLIQUID_DEPOSIT_USDC));
    const disabled =
        !value ||
        isInsufficientBalance ||
        isLessThanMinimum ||
        isInsufficientGas ||
        isGasLoading ||
        isQuoteLoading ||
        !depositToken ||
        isDepositTokenLoading ||
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

    const { mutateAsync, isPending } = useDepositToHyperliquid({
        depositToken: depositToken ?? undefined,
        amount,
        toastId: TOAST_ID,
        onSettled: () => {
            isSubmittingRef.current = false;
        },
    });

    const goToSelectToken = useGoToSelectToken({
        side: 'pay',
        from: SwapFromPage.PerpsDeposit,
    });

    useEffect(() => {
        inputRef.current?.focus();
        return () => {
            toast.dismiss(TOAST_ID);
        };
    }, []);

    if (isEmbeddedWalletLoading || !evmAddress || !isPrivyReady || isDefaultTokenLoading) {
        return <LoadingPanel />;
    }

    const receivedUsdText = formatTokenUSD(receivedUsdc, { minDisplay: 0.01 });
    const amountToggleText = inputType === DepositAmountInputType.Amount ? formatTokenUSD(usdValue) : amount;
    const isReceiveAmountLoading = isSameToken ? false : isQuoteLoading;

    return (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center px-4">
            <DepositPayTokenRow
                token={depositToken}
                isLoading={isDepositTokenLoading}
                isBalanceLoading={isBalanceLoading}
                onSelect={goToSelectToken}
            />
            <DepositAmountField
                id="perps-deposit-amount"
                inputRef={inputRef}
                inputProps={inputProps}
                inputType={inputType}
                placeholder={inputType === DepositAmountInputType.Amount ? '0' : '$0'}
                isInsufficientBalance={isInsufficientBalance}
                showUsdPrefix
                toggle={
                    depositToken && !isSameToken
                        ? {
                              payToken: { logoUrl: depositToken.logoUrl },
                              receiveToken: { logoUrl: arbUsdcTokenFallback.logoURI },
                              secondaryText: amountToggleText,
                              onToggle: () => {
                                  setValue(
                                      removeTrailingZeros(
                                          inputType === DepositAmountInputType.Amount ? usdValue : amount,
                                      ),
                                  );
                                  setInputType((prev) =>
                                      prev === DepositAmountInputType.Amount
                                          ? DepositAmountInputType.Usd
                                          : DepositAmountInputType.Amount,
                                  );
                              },
                          }
                        : null
                }
            />
            <DepositFormFooter
                receiveRow={
                    <DepositReceiveRow
                        chainId={ARBITRUM_CHAIN_ID}
                        icon={arbUsdcTokenFallback.logoURI}
                        symbol={arbUsdcTokenFallback.symbol}
                        name={arbUsdcTokenFallback.name}
                        subtitle={<Trans>into your perps account</Trans>}
                        amountText={receivedUsdText}
                        isAmountLoading={isReceiveAmountLoading}
                    />
                }
                onQuickAmountPick={(rate) => {
                    if (!depositToken?.balance) return;
                    const maxBn = BigNumber(depositToken.balance);
                    const cappedRate = rate === 1 ? Math.min(rate, 0.95) : rate;
                    const portion = maxBn.times(cappedRate).decimalPlaces(depositToken.decimals, BigNumber.ROUND_DOWN);
                    const newAmount = removeTrailingZeros(portion.toFixed());
                    setValue(
                        removeTrailingZeros(
                            inputType === DepositAmountInputType.Amount
                                ? newAmount
                                : BigNumber(newAmount)
                                      .times(depositToken.price ?? 1)
                                      .decimalPlaces(maxDecimals, BigNumber.ROUND_DOWN)
                                      .toFixed(),
                        ),
                    );
                }}
                buttonLabel={buttonLabel}
                disabled={disabled}
                loading={isPending}
                onSubmit={() => {
                    if (isSubmittingRef.current || isPending) return;
                    isSubmittingRef.current = true;
                    void mutateAsync();
                }}
            />
        </div>
    );
}
