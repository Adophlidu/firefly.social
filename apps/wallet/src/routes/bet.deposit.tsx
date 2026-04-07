import { delay } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { BigNumber } from 'bignumber.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { type Address, erc20Abi, formatUnits, parseUnits } from 'viem';
import { polygon } from 'viem/chains';
import { useConfig } from 'wagmi';
import { simulateContract, waitForTransactionReceipt, writeContract } from 'wagmi/actions';

import { BetError } from '@/components/Bet/BetError.js';
import { LoadingPanel } from '@/components/LoadingPanel.js';
import { NavigationBar } from '@/components/NavigationBar.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { TokenItem } from '@/components/TokenItem.js';
import { Button } from '@/components/ui/button.js';
import { NetworkType } from '@/constants/enum.js';
import { InsufficientGasError } from '@/constants/error.js';
import { USDC_E_POLYGON_ADDRESS } from '@/constants/ethereum.js';
import { addAndSwitchChain } from '@/helpers/addAndSwitchChain.js';
import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { getUserFacingErrorMessage } from '@/helpers/getErrorMessage.js';
import { isNativeEvmToken } from '@/helpers/isNativeEvmToken.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { isLessThan } from '@/helpers/number.js';
import { optimisticAddBalance } from '@/helpers/polymarketBalanceCache.js';
import { useEmbeddedEvmWalletContext } from '@/hooks/useCachedWalletAddresses.js';
import { useDecimalInput } from '@/hooks/useDecimalInput.js';
import { cn } from '@/lib/utils.js';
import type { TokenAsset } from '@/providers/types/Firefly.js';
import type { Token } from '@/providers/types/Transfer.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getPolymarketProfileListQueryOptions } from '@/queries/firefly/getPolymarketProfileListQueryOptions.js';
import { getMultiChainTokensQuery } from '@/queries/firefly/multiChainTokens.js';
import { getPolymarketUserValueQueryOptions } from '@/queries/polymarket/getPolymarketUserValueQueryOptions.js';
import { showEmbeddedWalletUIAtom } from '@/store/embeddedWallets.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';
import { store } from '@/store/index.js';

async function pollUntilReady(
    check: () => Promise<boolean>,
    opts: { maxAttempts?: number; initialDelay?: number; backoffMultiplier?: number } = {},
) {
    const { maxAttempts = 10, initialDelay = 500, backoffMultiplier = 1.5 } = opts;
    let delayMs = initialDelay;
    for (let i = 0; i < maxAttempts; i += 1) {
        if (await check()) return;
        await delay(delayMs);
        delayMs = Math.min(delayMs * backoffMultiplier, 5000);
    }
}

export const Route = createFileRoute('/bet/deposit')({
    component: DepositPage,
    pendingComponent: LoadingPanel,
    errorComponent: BetError,
});

const usdcTokenFallback = {
    amount: 0,
    decimals: 6,
    id: USDC_E_POLYGON_ADDRESS,
    logoUrl: 'https://cdn.zerion.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
    name: 'USD Coin (POS)',
    price: '1',
    rawAmount: '0',
    rawAmountHexStr: '0x0',
    symbol: 'USDC',
    chainId: polygon.id,
    balance: '0',
    usdValue: 1,
    networkType: NetworkType.Ethereum,
};

const fixedDepositTokenFallback = usdcTokenFallback;
const MINIMUM_USD = 1;

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
    const queryClient = useQueryClient();
    const {
        address: embeddedAddress,
        wallet: embeddedWallet,
        isLoading: isEmbeddedWalletLoading,
    } = useEmbeddedEvmWalletContext();
    const { setActiveWallet } = useSetActiveWallet();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const {
        data = [],
        refetch,
        isLoading: isTokenLoading,
    } = useQuery({
        ...getMultiChainTokensQuery(embeddedAddress ? [embeddedAddress] : [], [polygon.id]),
        select(data: { tokenAssets?: TokenAsset[] } | null | undefined): Token[] {
            return (data?.tokenAssets ?? []).map((x: TokenAsset) => formatTokenFromFireflyTokenAsset(x));
        },
    });
    const [value, setValue] = useState('');
    const { inputProps } = useDecimalInput({ value, onValueChange: setValue, maxDecimals: 2 });
    const depositToken = useMemo(() => {
        const t = data.find((x: Token) => isSameAddress(x.id, USDC_E_POLYGON_ADDRESS));
        if (t) {
            t.name = fixedDepositTokenFallback.name;
            return t;
        }
        return fixedDepositTokenFallback;
    }, [data]);
    const isInsufficientBalance = isLessThan(depositToken.amount, value);
    const isLessThanMinimum = isLessThan(value, MINIMUM_USD);
    const disabled = !value || isInsufficientBalance || isLessThanMinimum;

    const buttonLabel = useMemo(() => {
        if (isLessThanMinimum) {
            return <Trans>Minimum $1.00</Trans>;
        }
        return <Trans>Add Funds</Trans>;
    }, [isLessThanMinimum]);
    const config = useConfig();
    const isSubmittingRef = useRef(false);
    const toastId = 'polymarket-deposit';

    const { mutateAsync, isPending } = useMutation({
        async mutationFn() {
            store.set(showEmbeddedWalletUIAtom, false);
            if (!embeddedWallet || !embeddedAddress) {
                throw new Error('Embedded wallet not ready');
            }
            await setActiveWallet(embeddedWallet);
            const account = await getFireflyEndpoint().createPolymarketAccount();
            await queryClient.cancelQueries(getPolymarketAccountQueryOptions());
            const parsedValue = parseUnits(value, depositToken.decimals);
            if (isNativeEvmToken(depositToken)) {
                throw new Error('Native EVM token not supported');
            }
            await addAndSwitchChain(config, depositToken.chainId);

            const transferCall = {
                abi: erc20Abi,
                address: depositToken.id as Address,
                functionName: 'transfer' as const,
                args: [account.proxyAddress, parsedValue] as const,
                chainId: depositToken.chainId,
            };

            let gas: bigint | undefined;
            try {
                const client = createWagmiPublicClient(depositToken.chainId);
                const estimated = await client.estimateContractGas({
                    ...transferCall,
                    account: embeddedAddress as Address,
                });
                gas = (estimated * 120n) / 100n;
            } catch {
                gas = undefined;
            }

            {
                const client = createWagmiPublicClient(depositToken.chainId);
                const gasLimit = gas;
                if (gasLimit) {
                    const [gasPrice, nativeBalance] = await Promise.all([
                        client.getGasPrice(),
                        client.getBalance({ address: embeddedAddress as Address }),
                    ]);
                    const fee = gasLimit * gasPrice;
                    if (nativeBalance < fee) {
                        throw new InsufficientGasError();
                    }
                }
            }

            const { request } = await simulateContract(config, {
                ...transferCall,
                account: embeddedAddress as Address,
            });
            const txHash = await writeContract(config, {
                ...request,
                account: embeddedAddress as Address,
                gas: gas ?? request.gas,
            });
            toast.loading(<Trans>Your funds are on the way...</Trans>, { id: toastId });
            await waitForTransactionReceipt(config, {
                hash: txHash,
                chainId: depositToken.chainId,
            });
            await getFireflyEndpoint().polymarketDepositUpload(
                account.proxyAddress,
                embeddedAddress,
                parsedValue.toString(),
                txHash,
            );
            return account.proxyAddress as Address;
        },
        async onSuccess(proxyAddress: Address) {
            store.set(showEmbeddedWalletUIAtom, true);
            optimisticAddBalance(queryClient, proxyAddress, value);
            const proxyTokenQueryKey = ['multi-chain-token', proxyAddress.toLowerCase(), polygon.id] as const;
            await pollUntilReady(async () => {
                try {
                    const result = await queryClient.fetchQuery({
                        ...getPolymarketAccountQueryOptions(),
                        staleTime: 0,
                    });
                    return !!result?.proxyAddress;
                } catch {
                    return false;
                }
            });
            await Promise.all([
                queryClient.refetchQueries({
                    queryKey: getPolymarketAccountQueryOptions().queryKey,
                    exact: true,
                    type: 'all',
                }),
                refetch(),
                queryClient.refetchQueries({
                    queryKey: getPolymarketProfileListQueryOptions(proxyAddress, true).queryKey,
                }),
                queryClient.refetchQueries({ queryKey: proxyTokenQueryKey }),
                queryClient.refetchQueries({
                    queryKey: getPolymarketUserValueQueryOptions(proxyAddress).queryKey,
                    exact: true,
                    type: 'all',
                }),
            ]);
            toast.dismiss(toastId);
            toast.success(<Trans>Your funds are now in your predict wallet.</Trans>);
            navigate({ to: '/bet' });
        },
        onError(error: unknown) {
            store.set(showEmbeddedWalletUIAtom, true);
            toast.dismiss(toastId);
            const { message: userHint, details } = getUserFacingErrorMessage(error);
            toast.error(<Trans>Failed to add funds.</Trans>, { description: userHint || details });
        },
        onSettled() {
            isSubmittingRef.current = false;
        },
    });

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    if (isEmbeddedWalletLoading || isTokenLoading || !embeddedAddress || !embeddedWallet) {
        return <LoadingPanel />;
    }

    const usdcBalance = value || '0';
    const usdcBalanceUsdText = formatTokenUSD(usdcBalance, { minDisplay: 0.01 });

    return (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center px-4">
            <TokenItem token={depositToken} secondaryText={<Trans>in your Firefly wallet</Trans>} />
            <label
                className="relative flex min-h-0 w-full flex-1 items-center justify-between"
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
                    <div className="ml-auto text-sm font-semibold">{usdcBalanceUsdText}</div>
                </div>
                <div className="flex items-center justify-between gap-4">
                    {[0.25, 0.5, 0.75, 1].map((rate) => (
                        <button
                            key={rate}
                            className="bg-lightBg active:bg-main/10 h-8 w-[70px] rounded-full text-center font-semibold leading-8 duration-75 active:scale-95"
                            onClick={() => {
                                const ratedValueBigInt = BigInt(
                                    BigNumber(depositToken.rawAmount).times(rate).toFixed(0),
                                );
                                setValue(formatUnits(ratedValueBigInt, depositToken.decimals));
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
