import { web3 } from '@coral-xyz/anchor';
import ArrowDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import ComebackIcon from '@dimensiondev/assets/comeback2.svg';
import InfoIcon from '@dimensiondev/assets/info-outline.svg';
import SearchIcon from '@dimensiondev/assets/search.svg';
import WalletIcon from '@dimensiondev/assets/wallet.fill.svg';
import { safeUnreachable, unreachable } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useWallets } from '@privy-io/react-auth';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';
import { useQuery } from '@tanstack/react-query';
import { type HistoryState, Navigate, useNavigate, useRouter } from '@tanstack/react-router';
import { omit } from 'lodash-es';
import { RefreshCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { type Address, formatEther } from 'viem';
import { useAccount } from 'wagmi';

import { ActionButton } from '@/components/ActionButton.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import {
    isOnlyAddress,
    isSocialRecipient,
    RecipientItem,
    type RecipientItemProps,
} from '@/components/SendTransactionModal/RecipientItem.js';
import { type FormValues, RoutePath, useSendToken } from '@/components/SendTransactionModal/types.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { Button } from '@/components/ui/button.js';
import { queryClient } from '@/configs/queryClient.js';
import { config } from '@/configs/wagmi.js';
import { NetworkType } from '@/constants/enum.js';
import type { EthereumChainId } from '@/constants/ethereum.js';
import { SolanaChainId } from '@/constants/solana.js';
import { formatLamportsToSol } from '@/helpers/formatLamportsToSol.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { isNativeEvmToken } from '@/helpers/isNativeEvmToken.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { ETH_ZERO_ADDRESS, SOL_ZERO_ADDRESS } from '@/helpers/isZeroAddress.js';
import { normalizeDecimalInput } from '@/helpers/normalizeDecimalInput.js';
import { isGreaterThanOrEqualTo, multipliedBy, plus } from '@/helpers/number.js';
import { resolveEvmConnector } from '@/helpers/resolveEvmConnector.js';
import { resolveWagmiChain } from '@/helpers/resolveWagmiChain.js';
import { resolveSwapEvmSigningWallet } from '@/helpers/swap/resolveSwapSigningWallet.js';
import { useAutoHeightTextarea } from '@/hooks/useAutoHeightTextarea.js';
import { cn } from '@/lib/utils.js';
import { coinGeckoEndpoint } from '@/providers/coingecko/index.js';
import { getDefaultGas } from '@/providers/ethereum/getDefaultGas.js';
import { EthereumTransfer } from '@/providers/ethereum/Transfer.js';
import { SolanaTransfer } from '@/providers/solana/Transfer.js';
import type { Token, TransferProvider } from '@/providers/types/Transfer.js';

export function FormView() {
    const { token } = useSendToken();
    const navigate = useNavigate();

    if (!token) {
        return <Navigate to={RoutePath.SelectToken} />;
    }

    return (
        <div className="flex w-full flex-col px-6 pb-6">
            <div className="relative flex items-center justify-center py-6">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-0 top-1/2 -translate-y-1/2 [&_svg]:size-6"
                    onClick={() => navigate({ to: '/', replace: true })}
                >
                    <ComebackIcon />
                </Button>
                <h2 className="text-main text-lg font-semibold">
                    <Trans>Send</Trans>
                </h2>
            </div>
            <Form />
        </div>
    );
}

function Form() {
    const router = useRouter();
    const {
        handleSubmit,
        control,
        formState: { isSubmitting },
        register,
        setValue,
    } = useFormContext<FormValues>();
    const ethereum = useAccount();
    const { wallets: evmWallets } = useWallets();
    const { wallets: solanaWallets } = useSolanaWallets();
    const solana = solanaWallets[0];

    const evmTransfer = EthereumTransfer;
    const solanaTransfer = useMemo(() => new SolanaTransfer(solana), [solana]);

    function resolveTransferProvider(networkType: NetworkType): TransferProvider {
        switch (networkType) {
            case NetworkType.Ethereum:
                return evmTransfer as TransferProvider;
            case NetworkType.Solana:
                return solanaTransfer;
            default:
                unreachable(networkType);
        }
    }

    const onSubmit = async (values: FormValues) => {
        try {
            const to = values.to;
            const transfer = resolveTransferProvider(networkType);
            let connector: Awaited<ReturnType<typeof resolveEvmConnector>> = null;
            if (networkType === NetworkType.Ethereum) {
                const signingWallet = resolveSwapEvmSigningWallet(evmWallets, ethereum.address ?? null, {
                    preferEmbedded: true,
                });
                if (signingWallet) connector = await resolveEvmConnector(signingWallet);
            }
            const hash = await transfer.transfer({
                token: values.token,
                to,
                amount: values.amount,
                connector: connector ?? undefined,
            });
            router.navigate({
                to: RoutePath.Success,
                state: { ...values, hash } as unknown as HistoryState,
            });
            let address: string | undefined;
            switch (networkType) {
                case NetworkType.Ethereum:
                    address = ethereum.address;
                    break;
                case NetworkType.Solana:
                    address = solana.address;
                    break;
                default:
                    safeUnreachable(networkType);
                    return;
            }

            if (!address) return;
            const amountUsd = multipliedBy(values.amount, token.price).toNumber();
            // TODO: capture firefly wallet event
        } catch (error) {
            router.navigate({
                to: RoutePath.Failed,
                state: { error } as unknown as HistoryState,
            });
        }
    };

    const watching = useWatch({ control });
    const { to, amount } = watching;
    const token = watching.token as Token;
    const recipient = watching.recipient as RecipientItemProps | undefined;
    const showRecipient = recipient && !isOnlyAddress(recipient) && recipient?.address === watching.to;
    const networkType = token?.networkType;

    const [isFocusingAddressInput, setIsFocusingAddressInput] = useState(false);

    const toQueryKey = useMemo(
        () => (networkType === NetworkType.Ethereum ? (to?.toLowerCase() ?? '') : (to ?? '')),
        [networkType, to],
    );

    const tokenQueryKey = useMemo(
        () => (token ? { id: token.id, chainId: token.chainId, decimals: token.decimals } : null),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally use stable primitive fields only
        [token?.id, token?.chainId, token?.decimals],
    );

    const { data: availableBalance, isLoading: isLoadingAvailableBalance } = useQuery({
        queryKey: ['token-available-balance', networkType, tokenQueryKey],
        enabled: !!token && !!networkType,
        async queryFn() {
            if (!token || !networkType) return null;
            const transfer = resolveTransferProvider(networkType);
            return transfer.getAvailableBalance({
                to: networkType === NetworkType.Solana ? SOL_ZERO_ADDRESS : ETH_ZERO_ADDRESS,
                token,
                amount: '0',
            });
        },
    });

    const {
        data: estimatedGas,
        isFetching: isEstimatingGas,
        error: estimateGasError,
        refetch: refetchEstimateGas,
    } = useQuery({
        queryKey: ['estimateGas', tokenQueryKey, networkType, toQueryKey, amount],
        async queryFn() {
            if (!to || !amount || !token || !networkType) return null;

            switch (networkType) {
                case NetworkType.Ethereum: {
                    if (!isValidAddressEthereum(to)) return null;
                    const { gas } = await getDefaultGas(config, {
                        token: token as Token<EthereumChainId, Address>,
                        to,
                        amount,
                    });
                    const chain = resolveWagmiChain(token.chainId);
                    if (!chain) return null;
                    const price = await queryClient.ensureQueryData({
                        queryKey: ['fungible', 'token-price', chain.id, ETH_ZERO_ADDRESS],
                        queryFn: () => coinGeckoEndpoint.getFungibleTokenPrice(chain.id, ETH_ZERO_ADDRESS),
                    });
                    const rawGas = gas.toFixed(0);
                    const formatAmount = formatEther(BigInt(rawGas));
                    const usd = multipliedBy(price ?? 0, formatAmount).toString();

                    return {
                        amount: formatAmount,
                        usd,
                        symbol: chain.nativeCurrency.symbol,
                        rawGas,
                    };
                }
                case NetworkType.Solana: {
                    if (!solana.address) return null;
                    const transaction = await solanaTransfer.getTransferTransaction({
                        amount,
                        to: to ?? SOL_ZERO_ADDRESS,
                        token,
                    });
                    const latestBlockhash = await solanaTransfer.connection.getLatestBlockhash();
                    transaction.recentBlockhash = latestBlockhash.blockhash;
                    transaction.feePayer = new web3.PublicKey(solana.address);
                    const fee = await transaction.getEstimatedFee(solanaTransfer.connection);
                    if (!fee) return null;
                    const price = await coinGeckoEndpoint.getFungibleTokenPrice(
                        SolanaChainId.Mainnet,
                        SOL_ZERO_ADDRESS,
                    );
                    const formatAmount = formatLamportsToSol(fee);
                    const usd = multipliedBy(price ?? 0, formatAmount).toString();

                    return {
                        amount: formatAmount,
                        usd,
                        symbol: 'SOL',
                        rawGas: fee.toString(),
                    };
                }
                default:
                    safeUnreachable(networkType);
                    return;
            }
        },
        enabled: !!token && !!to && !!amount,
        retry: 1,
    });

    const { data: validatedResult, isLoading: isValidating } = useQuery({
        queryKey: ['validate-transfer', toQueryKey, amount, tokenQueryKey, token?.balance, estimatedGas?.rawGas],
        async queryFn() {
            if (!to || !amount || !token || !networkType) return null;

            switch (networkType) {
                case NetworkType.Ethereum:
                    if (!isValidAddressEthereum(to)) return { error: <Trans>This wallet address is invalid</Trans> };
                    break;
                case NetworkType.Solana:
                    if (!isValidAddressSolana(to)) return { error: <Trans>This wallet address is invalid</Trans> };
                    break;
                default:
                    safeUnreachable(networkType);
            }

            const balance = token.balance || '0';
            const totalNeeded =
                networkType === NetworkType.Ethereum && isNativeEvmToken(token) && estimatedGas?.amount
                    ? plus(amount, estimatedGas.amount).toString()
                    : amount;
            if (!isGreaterThanOrEqualTo(balance, totalNeeded)) {
                return { error: <Trans>Insufficient Balance</Trans> };
            }

            return null;
        },
        enabled: Boolean(to && amount && token && networkType),
        retry: 1,
    });

    useAutoHeightTextarea(() => document.getElementById('send-transaction-recipient') as HTMLTextAreaElement);

    return (
        <form
            className="flex min-h-0 w-full flex-col items-center gap-4 md:rounded-xl"
            onSubmit={handleSubmit((values) => onSubmit(values))}
        >
            <div className="no-scrollbar -mx-px flex min-h-0 w-full grow flex-col gap-3 overflow-y-auto px-px">
                <ClickableButton
                    className="bg-line flex w-full items-center justify-between rounded-xl p-4"
                    onClick={() => router.navigate({ to: RoutePath.SelectToken })}
                >
                    <div className="flex items-center gap-x-4">
                        <TokenIcon
                            icon={token.logoUrl}
                            networkType={networkType}
                            chainId={token.chainId}
                            size={36}
                            symbol={token.symbol}
                            name={token.name}
                        />
                        <div className="text-medium flex flex-col space-y-1 text-left">
                            <span className="h-[18px] leading-[18px]">{token.name}</span>
                            <span className="text-second h-3.5 text-[13px] leading-[14px]">
                                <Trans>
                                    Balance: {token.balance || '0'} {token.symbol || '-'}
                                </Trans>
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end justify-center">
                        <ArrowDownIcon width={18} height={18} />
                    </div>
                </ClickableButton>
                <div className="text-sm font-medium">
                    <Trans>To</Trans>
                </div>
                <div className="bg-line focus-within:bg-primaryBottom focus-within:ring-highlight relative flex w-full rounded-xl focus-within:ring-1">
                    {showRecipient && recipient ? (
                        <div
                            className={cn(
                                'pointer-events-none absolute left-0 top-0 flex w-full cursor-text p-4 duration-100',
                                {
                                    'opacity-0': isFocusingAddressInput,
                                },
                            )}
                        >
                            <RecipientItem {...(omit(recipient, 'handle', 'tags') as RecipientItemProps)} />
                        </div>
                    ) : null}
                    <label
                        htmlFor="send-transaction-recipient"
                        className={cn('flex w-full min-w-0 cursor-text items-center p-4 pr-0 duration-100', {
                            'opacity-0': !!showRecipient && !isFocusingAddressInput,
                        })}
                    >
                        <div className="border-line2 bg-primaryBottom flex size-9 items-center justify-center rounded-lg border">
                            <WalletIcon width={24} height={24} className="text-third" />
                        </div>
                        <textarea
                            id="send-transaction-recipient"
                            {...register('to', {
                                required: true,
                                onBlur() {
                                    setIsFocusingAddressInput(false);
                                },
                            })}
                            onFocus={() => setIsFocusingAddressInput(true)}
                            className="text-medium text-main placeholder:text-second max-h-9 min-h-[18px] flex-1 resize-none border-none bg-transparent p-0 pl-3 font-medium leading-[18px] focus:!shadow-none focus:!outline-none focus:!ring-transparent"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                            placeholder={t`Enter or search for a recipient wallet`}
                        />
                    </label>
                    <ClickableButton
                        onClick={() => router.navigate({ to: RoutePath.SearchRecipients })}
                        type="button"
                        className="relative z-10 flex h-full items-center justify-center p-4 pl-0"
                    >
                        <span className="flex size-9 items-center justify-center">
                            <SearchIcon width={18} height={18} />
                        </span>
                    </ClickableButton>
                </div>
                {recipient && isSocialRecipient(recipient) && isSameAddress(recipient.address, to) ? (
                    <div className="text-warn flex items-center space-x-3 rounded-2xl border border-current p-3 text-left text-[13px] font-medium leading-5">
                        <InfoIcon width={24} height={24} className="shrink-0" />
                        <div>
                            <Trans>
                                Wallet addresses linked to social accounts may change or be inaccurate. Always verify
                                before sending.
                            </Trans>
                        </div>
                    </div>
                ) : null}
                <div className="text-sm font-medium">
                    <Trans>Amount</Trans>
                </div>
                <div className="flex w-full flex-col space-y-1">
                    <label
                        htmlFor="send-transaction-amount"
                        className="bg-line focus-within:bg-primaryBottom focus-within:ring-highlight flex cursor-text items-center rounded-xl p-4 pl-2 duration-100 focus-within:ring-1"
                    >
                        <input
                            id="send-transaction-amount"
                            type="text"
                            {...register('amount', {
                                required: true,
                                onChange(e) {
                                    const normalized = normalizeDecimalInput(e.target.value, {
                                        maxDecimals: token.decimals,
                                        min: 0,
                                    });
                                    if (normalized !== e.target.value) {
                                        setValue('amount', normalized, { shouldValidate: true });
                                    }
                                },
                            })}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                            inputMode="decimal"
                            className="no-spinner text-medium text-main placeholder:text-second h-9 flex-1 border-none bg-transparent p-0 pl-3 placeholder:font-normal focus:!shadow-none focus:!outline-none focus:!ring-transparent"
                            placeholder={t`Enter amount`}
                        />
                        <ClickableButton
                            onClick={() => {
                                if (!availableBalance) return;
                                setValue('amount', availableBalance, {
                                    shouldValidate: true,
                                });
                            }}
                            loading={isLoadingAvailableBalance}
                            onlyLoading
                            type="button"
                            className="text-medium text-highlight flex size-9 items-center justify-center font-semibold uppercase"
                        >
                            <Trans>Max</Trans>
                        </ClickableButton>
                    </label>
                </div>
                <div className="flex h-[18px] w-full flex-row justify-between whitespace-nowrap text-sm leading-[18px]">
                    <div className="text-second font-normal">
                        <Trans>Network cost</Trans>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                        {isEstimatingGas ? (
                            <LoadingIcon size={14} />
                        ) : estimatedGas ? (
                            <>
                                {renderShrankPrice(formatPrice(estimatedGas.amount) ?? '-')} ${estimatedGas.symbol} ≈ $
                                {renderShrankPrice(formatPrice(estimatedGas.usd) ?? '-')}
                            </>
                        ) : estimateGasError ? (
                            <ClickableButton
                                className="text-second flex items-center gap-1"
                                onClick={() => refetchEstimateGas()}
                                type="button"
                            >
                                -
                                <RefreshCcw size={14} />
                            </ClickableButton>
                        ) : (
                            '-'
                        )}
                    </div>
                </div>
            </div>
            <div className="w-full shrink-0">
                <ActionButton
                    className="h-10 w-full rounded-lg"
                    type="submit"
                    disabled={isSubmitting || !!validatedResult?.error || isValidating || !to || !amount || !token}
                >
                    {isValidating || isSubmitting ? (
                        <LoadingIcon size={20} />
                    ) : (
                        <span className="text-medium">{validatedResult?.error ?? <Trans>Send</Trans>}</span>
                    )}
                </ActionButton>
            </div>
        </form>
    );
}
