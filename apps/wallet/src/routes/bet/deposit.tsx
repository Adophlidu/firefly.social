import QrCodeIcon from '@dimensiondev/assets/qrcode.svg';
import { BET_DEPOSIT_MIN_USD } from '@dimensiondev/constants/static';
import { SwapFromPage } from '@dimensiondev/enums';
import { removeTrailingZeros } from '@dimensiondev/utils';
import { isSolanaChain } from '@dimensiondev/web3/chains';
import { isLessThan, multipliedBy, toFixed } from '@dimensiondev/web3/numbers';
import { isNativeTokenOrSameAddress } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useRouterState } from '@dimensiondev/ssr';
import { BigNumber } from 'bignumber.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { formatUnits } from 'viem';

import { BetError } from '@/components/Bet/BetError.js';
import { DepositAmountField } from '@/components/Deposit/DepositAmountField.js';
import { DepositFormFooter } from '@/components/Deposit/DepositFormFooter.js';
import { DepositPayTokenRow } from '@/components/Deposit/DepositPayTokenRow.js';
import { DepositReceiveRow } from '@/components/Deposit/DepositReceiveRow.js';
import { LoadingPanel } from '@/components/LoadingPanel.js';
import { NavigationBar, NavigationBarRight } from '@/components/NavigationBar.js';
import { ModalType } from '@/configs/modalRoutes.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';
import { useAddFunds } from '@/hooks/bet/useAddFunds.js';
import { useCheckGasForDeposit } from '@/hooks/bet/useCheckGasForDeposit.js';
import { pusdTokenFallback, useDepositToken } from '@/hooks/bet/useTokenDetail.js';
import { DepositAmountInputType } from '@/hooks/deposit/depositAmountInputType.js';
import { useDepositAmountConversion } from '@/hooks/deposit/useDepositAmountConversion.js';
import { useGoToSelectToken } from '@/hooks/swap/useGoToSelectToken.js';
import { useSwapQuoteCore } from '@/hooks/swap/useSwapQuoteCore.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { useDecimalInput } from '@/hooks/useDecimalInput.js';
import { getPolymarketWithdrawSupportedTokensQueryOptions } from '@/queries/firefly/getPolymarketWithdrawSupportedTokensQueryOptions.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export default DepositPage;

const TOAST_ID = 'polymarket-deposit';

function DepositPage() {
    const navigate = useNavigate();
    const { pathname, search } = useRouterState();
    const { data: polymarketAccount } = useQuery({
        queryKey: ['polymarket-account'],
        staleTime: 1000 * 60 * 5,
        queryFn: async () => {
            const account = await getFireflyEndpoint().createPolymarketAccount();
            return account;
        },
    });

    useEffect(() => {
        if (polymarketAccount?.proxyAddress) {
            captureWalletTelemetryEvent(WalletTelemetryEventId.BETS_ADD_FUNDS_OPEN_SUCCESS, {
                proxy_wallet_address: polymarketAccount.proxyAddress,
            });
        }
    }, [polymarketAccount?.proxyAddress]);

    const openDepositViaCrypto = () => {
        captureWalletTelemetryEvent(WalletTelemetryEventId.BETS_DEPOSIT_VIA_CRYPTO_CLICK, {});
        const params = new URLSearchParams(search);
        params.set('modal', ModalType.DepositViaCrypto);
        navigate(`${pathname}?${params.toString()}`, { replace: true });
    };

    return (
        <>
            <NavigationBar>
                <Trans>Fund via Firefly Wallet</Trans>
                <NavigationBarRight>
                    <button
                        type="button"
                        className="flex items-center justify-center rounded-md p-1 text-main hover:bg-lightBg"
                        onClick={openDepositViaCrypto}
                    >
                        <QrCodeIcon width={24} height={24} />
                    </button>
                </NavigationBarRight>
            </NavigationBar>
            <DepositClient />
        </>
    );
}

function DepositClient() {
    const isSubmittingRef = useRef(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [value, setValue] = useState('');
    const [inputType, setInputType] = useState(DepositAmountInputType.Usd);

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

    const maxDecimals = inputType === DepositAmountInputType.Amount && depositToken ? depositToken.decimals : 2;
    const { inputProps } = useDecimalInput({ value, onValueChange: setValue, maxDecimals });
    const { evmAddress, solanaAddress, isLoading: isEmbeddedWalletLoading } = useEmbeddedWalletAddresses();
    const { data: polymarketAccount, isLoading: isPolymarketAccountLoading } = useQuery({
        queryKey: ['polymarket-account'],
        staleTime: 1000 * 60 * 5,
        queryFn: async () => {
            const account = await getFireflyEndpoint().createPolymarketAccount();
            return account;
        },
    });

    const isSameToken =
        depositToken?.chainId === pusdTokenFallback.chainId &&
        isNativeTokenOrSameAddress(depositToken.address, pusdTokenFallback.address);
    const { amount, usdValue } = useDepositAmountConversion({
        value,
        inputType,
        depositToken,
        isSameAsReceiveToken: isSameToken,
    });

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
    const receivedUsdc = isSameToken ? usdValue : (quote?.toAmount ?? '0');
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
    const amountToggleText = inputType === DepositAmountInputType.Amount ? formatTokenUSD(usdValue) : amount;

    return (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center px-4">
            <DepositPayTokenRow
                token={depositToken}
                isLoading={isDepositTokenLoading}
                isBalanceLoading={isBalanceLoading}
                onSelect={goToSelectToken}
            />
            <DepositAmountField
                id="deposit-amount"
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
                              receiveToken: { logoUrl: pusdTokenFallback.logoUrl },
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
                        chainId={pusdTokenFallback.chainId}
                        icon={pusdTokenFallback.logoUrl}
                        symbol={pusdTokenFallback.symbol}
                        name={pusdTokenFallback.name}
                        subtitle={<Trans>into your predict wallet</Trans>}
                        amountText={usdcBalanceUsdText}
                        isAmountLoading={isQuoteLoading}
                    />
                }
                onQuickAmountPick={(rate) => {
                    if (!depositToken) return;

                    const ratedValueBigInt = BigInt(BigNumber(depositToken.rawAmount).times(rate).toFixed(0));
                    const newAmount = formatUnits(ratedValueBigInt, depositToken.decimals);
                    setValue(
                        removeTrailingZeros(
                            inputType === DepositAmountInputType.Amount
                                ? toFixed(newAmount, maxDecimals, BigNumber.ROUND_FLOOR)
                                : toFixed(
                                      multipliedBy(newAmount, depositToken.price ?? 0),
                                      maxDecimals,
                                      BigNumber.ROUND_FLOOR,
                                  ),
                        ),
                    );
                }}
                buttonLabel={buttonLabel}
                disabled={disabled}
                loading={isPending}
                onSubmit={() => {
                    if (isSubmittingRef.current || isPending) return;
                    isSubmittingRef.current = true;
                    captureWalletTelemetryEvent(WalletTelemetryEventId.BETS_ADD_FUNDS_CLICK, {
                        chain_id: String(depositToken?.chainId ?? ''),
                        target_chain_id: String(pusdTokenFallback.chainId),
                        firefly_wallet_address: embeddedAddress ?? '',
                        firefly_wallet_type: depositToken && isSolanaChain(depositToken.chainId) ? 'sol' : 'evm',
                        proxy_wallet_address: polymarketAccount?.proxyAddress ?? '',
                        token_type: depositToken?.address ? 'erc20_token' : 'native_token',
                        token_address: depositToken?.address || undefined,
                        token_symbol: depositToken?.symbol ?? '',
                        token_name: depositToken?.name ?? '',
                        token_amount: Number(amount) || 0,
                        amount_usd: Number(usdValue) || 0,
                    });
                    void mutateAsync();
                }}
            />
        </div>
    );
}
