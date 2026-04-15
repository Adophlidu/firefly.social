import ArrowDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import InfoOutlineIcon from '@dimensiondev/assets/info-outline.svg';
import { Trans } from '@lingui/react/macro';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { signMessage } from '@wagmi/core';
import { BigNumber } from 'bignumber.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useDebounceValue } from 'usehooks-ts';
import { parseUnits } from 'viem';
import { polygon } from 'viem/chains';
import { useConfig } from 'wagmi';

import { BetError } from '@/components/Bet/BetError.js';
import {
    DialogOrDrawer,
    DialogOrDrawerClose,
    DialogOrDrawerContent,
    DialogOrDrawerDescription,
    DialogOrDrawerFooter,
    DialogOrDrawerTitle,
    DialogOrDrawerTrigger,
} from '@/components/DialogOrDrawer.js';
import { LoadingPanel } from '@/components/LoadingPanel.js';
import { NavigationBar } from '@/components/NavigationBar.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { Button } from '@/components/ui/button.js';
import { useComeback } from '@/components/useComeback.js';
import { SwapFromPage } from '@/constants/enum.js';
import { formatTokenItemAmount } from '@/helpers/formatTokenItemAmount.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { isGreaterThan, isLessThan } from '@/helpers/number.js';
import { optimisticSubtractBalance } from '@/helpers/polymarketBalanceCache.js';
import { waitForPolymarketWithdraw } from '@/helpers/waitForPolymarketWithdraw.js';
import { usdcTokenFallback, useWithdrawToken } from '@/hooks/bet/useTokenDetail.js';
import { useGoToSelectToken } from '@/hooks/swap/useGoToSelectToken.js';
import { useEmbeddedEvmWalletContext } from '@/hooks/useCachedWalletAddresses.js';
import { useDecimalInput } from '@/hooks/useDecimalInput.js';
import { cn } from '@/lib/utils.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getPolymarketProfileListQueryOptions } from '@/queries/firefly/getPolymarketProfileListQueryOptions.js';
import { getPolymarketWithdrawableAmountQueryOptions } from '@/queries/firefly/getPolymarketWithdrawableAmountQueryOptions.js';
import { getPolymarketUserValueQueryOptions } from '@/queries/polymarket/getPolymarketUserValueQueryOptions.js';
import { showEmbeddedWalletUIAtom } from '@/store/embeddedWallets.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';
import { store } from '@/store/index.js';

export const Route = createFileRoute('/bet/withdraw')({
    component: WithdrawPage,
    pendingComponent: LoadingPanel,
    errorComponent: BetError,
});

const MINIMUM_USD = 1;

function WithdrawPage() {
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

    const { address, wallet, isLoading: isEmbeddedWalletLoading } = useEmbeddedEvmWalletContext();
    const { setActiveWallet } = useSetActiveWallet();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [value, setValue] = useState('');
    const { inputProps } = useDecimalInput({ value, onValueChange: setValue, maxDecimals: 2 });
    const { data: account } = useSuspenseQuery(getPolymarketAccountQueryOptions());
    const { data: withdrawableAmount } = useSuspenseQuery(
        getPolymarketWithdrawableAmountQueryOptions(account.proxyAddress),
    );
    const [debounceValue] = useDebounceValue(value, 300);
    const { token: targetToken, isLoading: isLoadingTargetToken } = useWithdrawToken();

    const { data: withdrawPreview, isLoading: isLoadingWithdrawPreview } = useQuery({
        queryKey: ['withdraw-preview', targetToken?.chainId, targetToken?.id, debounceValue],
        async queryFn() {
            if (!targetToken) return null;

            const amount = parseUnits(debounceValue, usdcTokenFallback.decimals);
            return getFireflyEndpoint().getPolymarketWithdrawAmount(
                amount.toString(),
                targetToken.id,
                targetToken.chainId,
            );
        },
        enabled: !!debounceValue && isGreaterThan(debounceValue, 0) && !!targetToken,
    });
    const config = useConfig();
    const isSubmittingRef = useRef(false);
    const toastId = 'polymarket-withdraw';
    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    const { mutate, isPending, isSuccess } = useMutation({
        async mutationFn() {
            if (!wallet || !address) {
                throw new Error('Embedded wallet not ready');
            }
            if (!targetToken) {
                throw new Error('No token selected');
            }

            toast.loading(<Trans>Withdrawing funds to your Firefly wallet...</Trans>, { id: toastId });
            store.set(showEmbeddedWalletUIAtom, false);
            await setActiveWallet(wallet);
            const amount = parseUnits(value, usdcTokenFallback.decimals);
            const originalMessage = 'polymarket withdraw';
            const signature = await signMessage(config, {
                message: originalMessage,
                account: address as `0x${string}`,
            });
            const { hash } = await getFireflyEndpoint().polymarketWithdraw(
                amount.toString(),
                targetToken.id,
                targetToken.chainId,
                originalMessage,
                signature,
            );
            const status = await waitForPolymarketWithdraw(hash, targetToken.chainId !== polygon.id);
            if (!status) {
                throw new Error('Failed to confirm withdraw status from Firefly');
            }

            await getFireflyEndpoint().polymarketWithdrawUpload(account.proxyAddress, address, amount.toString(), hash);
        },
        async onSuccess() {
            store.set(showEmbeddedWalletUIAtom, true);
            optimisticSubtractBalance(queryClient, account.proxyAddress, value);
            const profileQuery = getPolymarketProfileListQueryOptions(account.proxyAddress, true);
            const walletTokenQueryKey = address
                ? (['multi-chain-token', address.toLowerCase(), polygon.id] as const)
                : null;

            await Promise.all([
                queryClient.refetchQueries({ queryKey: profileQuery.queryKey, exact: true, type: 'all' }),
                queryClient.refetchQueries({
                    queryKey: getPolymarketUserValueQueryOptions(account.proxyAddress).queryKey,
                    exact: true,
                    type: 'all',
                }),
                walletTokenQueryKey
                    ? queryClient.refetchQueries({ queryKey: walletTokenQueryKey, exact: true, type: 'all' })
                    : Promise.resolve(),
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
    const isLessThanMinimum = isLessThan(value, MINIMUM_USD);
    const disabled =
        !value ||
        isInsufficientBalance ||
        isLessThanMinimum ||
        !withdrawPreview ||
        !targetToken ||
        isLoadingTargetToken;
    const buttonLabel = useMemo(() => {
        if (isLessThanMinimum) {
            return <Trans>Minimum $1.00</Trans>;
        }
        return <Trans>Withdraw</Trans>;
    }, [isLessThanMinimum]);

    if (isEmbeddedWalletLoading || !address || !wallet) {
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
                    <div className="text-second text-sm">
                        <Trans>{formatTokenItemAmount(withdrawableAmount)} available</Trans>
                    </div>
                </span>
            </label>
            <div className="w-full space-y-4 pb-4">
                {isLoadingTargetToken || !targetToken ? (
                    <div className="flex h-[60px] w-full items-center gap-4">
                        <div className="bg-lightBg size-9 rounded-full" />
                        <div className="flex-1">
                            <div className="bg-lightBg h-5 w-[50px]" />
                            <div className="bg-lightBg mt-1 h-3 w-[100px]" />
                        </div>
                        <div className="bg-lightBg h-5 w-7" />
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
                            <div className="text-second w-full text-xs font-medium leading-3">
                                <Trans>in your Firefly wallet</Trans>
                            </div>
                        </div>
                        <div
                            className={cn(
                                'ml-auto min-h-5 max-w-[50%] shrink-0 break-all rounded text-sm font-semibold',
                                {
                                    'bg-lightBg inline-block min-w-12 animate-pulse text-transparent':
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
                            className="bg-lightBg active:bg-main/10 h-8 w-[70px] rounded-full text-center font-semibold leading-8 duration-75 active:scale-95"
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
                        mutate();
                    }}
                >
                    {buttonLabel}
                </Button>
                <DialogOrDrawer>
                    <DialogOrDrawerTrigger asChild>
                        <button
                            type="button"
                            className="text-second mt-4 flex h-3.5 w-full items-center justify-center text-xs"
                        >
                            <span className="mr-1">
                                <Trans>
                                    Service fee:{' '}
                                    <span
                                        className={cn('h-3.5 rounded', {
                                            'bg-lightBg w-20 text-transparent': isLoadingWithdrawPreview,
                                        })}
                                    >
                                        {formatTokenUSD(withdrawPreview?.fee ?? 0, { minDisplay: 0.01 })}
                                    </span>
                                </Trans>
                            </span>
                            <InfoOutlineIcon width={14} height={14} />
                        </button>
                    </DialogOrDrawerTrigger>

                    <DialogOrDrawerContent>
                        <div className="flex w-full items-center gap-2 py-6">
                            <InfoOutlineIcon width={24} height={24} />
                            <DialogOrDrawerTitle className="text-main text-left text-xl font-semibold leading-6">
                                <Trans>Service fee</Trans>
                            </DialogOrDrawerTitle>
                        </div>

                        <DialogOrDrawerDescription className="text-main pb-6 text-left text-base font-medium leading-5">
                            <Trans>Firefly charges a fee for withdraw based on the withdraw funds amount.</Trans>
                        </DialogOrDrawerDescription>

                        <DialogOrDrawerFooter className="w-full pt-0">
                            <DialogOrDrawerClose asChild>
                                <Button variant="primary" size="lg" className="w-full rounded-full" type="button">
                                    <Trans>Done</Trans>
                                </Button>
                            </DialogOrDrawerClose>
                        </DialogOrDrawerFooter>
                    </DialogOrDrawerContent>
                </DialogOrDrawer>
            </div>
        </div>
    );
}
