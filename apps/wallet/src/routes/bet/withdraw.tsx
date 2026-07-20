import ArrowDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import { BET_DEPOSIT_MIN_USD, PRIVY_CONNECTOR_ID } from '@dimensiondev/constants/static';
import { SwapFromPage } from '@dimensiondev/enums';
import { isSolanaChain } from '@dimensiondev/web3/chains';
import { isGreaterThan, isLessThan } from '@dimensiondev/web3/numbers';
import { formatTokenItemAmount, isSameEthereumAddress } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useDebounceValue } from 'usehooks-ts';
import { parseUnits } from 'viem';
import { polygon } from 'viem/chains';
import { useConnectors, useSignMessage } from 'wagmi';

import { BetError } from '@/components/Bet/BetError.js';
import { LoadingPanel } from '@/components/LoadingPanel.js';
import { NavigationBar } from '@/components/NavigationBar.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { Button } from '@/components/ui/button.js';
import { useComeback } from '@/components/useComeback.js';
import { optimisticSubtractBalance } from '@/helpers/polymarketBalanceCache.js';
import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';
import { toastLoading } from '@/helpers/toastLoading.js';
import { waitForPolymarketWithdraw } from '@/helpers/waitForPolymarketWithdraw.js';
import { useWithdrawToken } from '@/hooks/bet/useTokenDetail.js';
import { useGoToSelectToken } from '@/hooks/swap/useGoToSelectToken.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { useDecimalInput } from '@/hooks/useDecimalInput.js';
import { cn } from '@/lib/utils.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getPolymarketProfileListQueryOptions } from '@/queries/firefly/getPolymarketProfileListQueryOptions.js';
import { getPolymarketWithdrawableAmountQueryOptions } from '@/queries/firefly/getPolymarketWithdrawableAmountQueryOptions.js';
import { getPolymarketWithdrawSupportedTokensQueryOptions } from '@/queries/firefly/getPolymarketWithdrawSupportedTokensQueryOptions.js';
import { getPolymarketUserValueQueryOptions } from '@/queries/polymarket/getPolymarketUserValueQueryOptions.js';
import { showEmbeddedWalletUIAtom } from '@/store/embeddedWallets.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';
import { store } from '@/store/index.js';

export default WithdrawPage;
function WithdrawPage() {
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());

    useEffect(() => {
        if (account?.proxyAddress) {
            captureWalletTelemetryEvent(WalletTelemetryEventId.BETS_WITHDRAW_FUNDS_OPEN_SUCCESS, {
                proxy_wallet_address: account.proxyAddress,
            });
        }
    }, [account?.proxyAddress]);

    return (
        <>
            <NavigationBar>
                <Trans>Withdraw</Trans>
            </NavigationBar>
            <WithdrawClient />
        </>
    );
}

function WithdrawClient() {
    const comeback = useComeback('/bet');
    const queryClient = useQueryClient();
    const connectors = useConnectors();

    const { evmAddress, solanaAddress, isLoading: isEmbeddedWalletLoading } = useEmbeddedWalletAddresses();
    const { mutateAsync } = useSignMessage();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [value, setValue] = useState('');
    const { inputProps } = useDecimalInput({ value, onValueChange: setValue, maxDecimals: 2 });
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const { data: withdrawableAmount } = useSuspenseQuery(
        getPolymarketWithdrawableAmountQueryOptions(account.proxyAddress),
    );
    const { data: supportedTokens } = useQuery(getPolymarketWithdrawSupportedTokensQueryOptions());
    const [debounceValue] = useDebounceValue(value, 300);
    const { token: targetToken, isLoading: isLoadingTargetToken } = useWithdrawToken(supportedTokens);

    const minCheckoutUsd = useMemo(() => {
        if (!supportedTokens || !targetToken) return BET_DEPOSIT_MIN_USD;
        const match = supportedTokens.find(
            (t) => isSameEthereumAddress(t.token_address, targetToken.id) && t.chain_id === targetToken.chainId,
        );
        return match?.min_checkout_usd ?? BET_DEPOSIT_MIN_USD;
    }, [supportedTokens, targetToken]);

    const { data: withdrawPreview, isLoading: isLoadingWithdrawPreview } = useQuery({
        queryKey: ['withdraw-preview', targetToken?.chainId, targetToken?.id, debounceValue],
        async queryFn() {
            if (!targetToken) return null;

            const amount = parseUnits(debounceValue, 6);
            return getFireflyEndpoint().getPolymarketWithdrawAmount(
                amount.toString(),
                targetToken.id,
                targetToken.chainId,
            );
        },
        enabled: !!debounceValue && isGreaterThan(debounceValue, 0) && !!targetToken,
    });
    const isSubmittingRef = useRef(false);
    const toastId = 'polymarket-withdraw';
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const receiverAddress = !targetToken ? null : isSolanaChain(targetToken.chainId) ? solanaAddress : evmAddress;
    const { mutate, isPending, isSuccess } = useMutation({
        async mutationFn() {
            if (!targetToken) {
                throw new Error('No token selected');
            }
            if (!receiverAddress) {
                throw new Error('Embedded wallet not ready');
            }

            toastLoading(<Trans>Withdrawing funds to your Firefly wallet...</Trans>, { id: toastId });
            store.set(showEmbeddedWalletUIAtom, false);
            const amount = parseUnits(value, 6);
            const originalMessage = 'polymarket withdraw';
            const signature = await mutateAsync({
                message: originalMessage,
                connector: connectors.find((c) => c.id === PRIVY_CONNECTOR_ID),
            });
            const { hash, isDepositAddress } = await getFireflyEndpoint().polymarketWithdraw(
                amount.toString(),
                targetToken.id,
                targetToken.chainId,
                originalMessage,
                signature,
            );

            const status = await waitForPolymarketWithdraw(hash, targetToken.chainId !== polygon.id, isDepositAddress);
            if (!status) {
                throw new Error('Failed to confirm withdraw status from Firefly');
            }

            await getFireflyEndpoint().polymarketWithdrawUpload(
                account.proxyAddress,
                receiverAddress,
                amount.toString(),
                hash,
            );
        },
        async onSuccess() {
            store.set(showEmbeddedWalletUIAtom, true);
            optimisticSubtractBalance(queryClient, account.proxyAddress, value);
            const profileQuery = getPolymarketProfileListQueryOptions(account.proxyAddress, true);

            await Promise.allSettled([
                queryClient.refetchQueries({ queryKey: profileQuery.queryKey, exact: true, type: 'all' }),
                queryClient.refetchQueries({
                    queryKey: getPolymarketUserValueQueryOptions(account.proxyAddress).queryKey,
                    exact: true,
                    type: 'all',
                }),
                queryClient.refetchQueries({ queryKey: ['polymarket-balance'] }),
                queryClient.invalidateQueries({
                    queryKey: ['multi-chain-token'],
                }),
            ]);
            toast.dismiss(toastId);
            toast.success(<Trans>Your funds have been withdrawn to your Firefly wallet.</Trans>);
            comeback();
        },
        onError(error: unknown) {
            store.set(showEmbeddedWalletUIAtom, true);
            toast.dismiss(toastId);
            toast.error(<Trans>Failed to withdraw.</Trans>, {
                description: (error instanceof Error ? error.message : String(error)).split('\n')[0],
            });
        },
        onSettled() {
            isSubmittingRef.current = false;
        },
    });

    const goToSelectToken = useGoToSelectToken({
        side: 'receive',
        from: SwapFromPage.BetWithdraw,
    });

    const isInsufficientBalance = !isSuccess && !isPending && isLessThan(withdrawableAmount, value);
    const isLessThanMinimum = isLessThan(value, minCheckoutUsd);
    const disabled =
        !value ||
        isInsufficientBalance ||
        isLessThanMinimum ||
        !withdrawPreview ||
        !targetToken ||
        isLoadingTargetToken;
    const buttonLabel = useMemo(() => {
        if (isInsufficientBalance) {
            return <Trans>Insufficient Balance</Trans>;
        }
        if (isLessThanMinimum) {
            return <Trans>Minimum ${minCheckoutUsd.toFixed(2)}</Trans>;
        }
        return <Trans>Withdraw</Trans>;
    }, [isLessThanMinimum, isInsufficientBalance, minCheckoutUsd]);

    if (isEmbeddedWalletLoading || !evmAddress || !receiverAddress) {
        return <LoadingPanel />;
    }

    return (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center px-4">
            <label
                className="relative flex min-h-0 w-full flex-1 items-center justify-between"
                htmlFor="withdraw-amount"
            >
                <span className="flex w-full flex-col items-center">
                    <input
                        id="withdraw-amount"
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
                    <div className="text-sm text-second">
                        <Trans>{formatTokenItemAmount(withdrawableAmount)} available</Trans>
                    </div>
                </span>
            </label>
            <div className="w-full space-y-4 pb-4">
                {isLoadingTargetToken || !targetToken ? (
                    <div className="flex h-[60px] w-full items-center gap-4">
                        <div className="size-9 rounded-full bg-lightBg" />
                        <div className="flex-1">
                            <div className="h-5 w-[50px] bg-lightBg" />
                            <div className="mt-1 h-3 w-[100px] bg-lightBg" />
                        </div>
                        <div className="h-5 w-7 bg-lightBg" />
                    </div>
                ) : (
                    <div className="flex h-[60px] w-full items-center">
                        <TokenIcon
                            size={36}
                            badgeSize={16}
                            className="shrink-0"
                            badgeClassName="bg-white"
                            chainId={targetToken.chainId}
                            icon={targetToken.logoUrl}
                            symbol={targetToken.symbol}
                            name={targetToken.name}
                        />
                        <div
                            className="ml-4 flex w-full min-w-0 cursor-pointer flex-col justify-start text-left"
                            onClick={goToSelectToken}
                        >
                            <div className="flex h-5 w-full items-center gap-1 truncate text-sm font-semibold">
                                <Trans>Receive</Trans>
                                <ArrowDownIcon width={16} height={16} />
                            </div>
                            <div className="w-full text-xs font-medium leading-3 text-second">
                                <Trans>in your Firefly wallet</Trans>
                            </div>
                        </div>
                        <div
                            className={cn(
                                'ml-auto min-h-5 max-w-[50%] shrink-0 break-all rounded text-sm font-semibold',
                                {
                                    'inline-block min-w-12 animate-pulse bg-lightBg text-transparent':
                                        isLoadingWithdrawPreview,
                                },
                            )}
                        >
                            {isLoadingWithdrawPreview
                                ? null
                                : `${formatTokenItemAmount(withdrawPreview?.amount ?? 0)} ${targetToken.symbol}`}
                        </div>
                    </div>
                )}
                <div className="flex items-center justify-between gap-4">
                    {[0.25, 0.5, 0.75, 1].map((rate) => (
                        <button
                            key={rate}
                            className="h-8 w-[70px] rounded-full bg-lightBg text-center font-semibold leading-8 duration-75 active:scale-95 active:bg-main/10"
                            onClick={() => {
                                setValue(BigNumber(withdrawableAmount).times(rate).toString());
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
                        captureWalletTelemetryEvent(WalletTelemetryEventId.BETS_WITHDRAW_FUNDS_CLICK, {
                            chain_id: String(polygon.id),
                            target_chain_id: String(targetToken?.chainId ?? ''),
                            proxy_wallet_address: account.proxyAddress,
                            firefly_wallet_address: receiverAddress ?? '',
                            firefly_wallet_type: targetToken && isSolanaChain(targetToken.chainId) ? 'sol' : 'evm',
                            token_type: targetToken?.id ? 'erc20_token' : 'native_token',
                            token_address: targetToken?.id !== targetToken?.symbol ? targetToken?.id : undefined,
                            token_symbol: targetToken?.symbol ?? '',
                            token_name: targetToken?.name ?? '',
                            token_amount: Number(value) || 0,
                            amount_usd: Number(value) || 0,
                        });
                        mutate();
                    }}
                >
                    {buttonLabel}
                </Button>
            </div>
        </div>
    );
}
