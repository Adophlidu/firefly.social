import { web3 } from '@coral-xyz/anchor';
import ArrowDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import InfoIcon from '@dimensiondev/assets/info-outline.svg';
import SearchIcon from '@dimensiondev/assets/search.svg';
import WalletIcon from '@dimensiondev/assets/wallet.fill.svg';
import { PRIVY_CONNECTOR_ID } from '@dimensiondev/constants/static';
import { NetworkType } from '@dimensiondev/enums';
import { useNavigate } from '@dimensiondev/ssr';
import { removeTrailingZeros, safeUnreachable, unreachable } from '@dimensiondev/utils';
import { resolveWagmiChain, solana as solanaMainnetChain } from '@dimensiondev/web3/chains';
import { ETH_ZERO_ADDRESS, SOL_ZERO_ADDRESS } from '@dimensiondev/web3/constants';
import { isGreaterThanOrEqualTo, multipliedBy, plus } from '@dimensiondev/web3/numbers';
import {
    formatLamportsToSol,
    isNativeTokenDebank,
    isSameAddress,
    isValidAddress,
    isValidAddressEthereum,
    isValidAddressSolana,
} from '@dimensiondev/web3/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { omit } from 'lodash-es';
import { RefreshCcw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useAsyncFn } from 'react-use';
import { type Address, formatEther } from 'viem';
import { useConnections } from 'wagmi';

import { ActionButton } from '@/components/ActionButton.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Navigate } from '@/components/Navigate.js';
import { NavigationBar } from '@/components/NavigationBar.js';
import {
    isOnlyAddress,
    isSocialRecipient,
    RecipientItem,
    type RecipientItemProps,
} from '@/components/SendTransactionModal/RecipientItem.js';
import { type FormValues, RoutePath, useSendToken } from '@/components/SendTransactionModal/types.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { queryClient } from '@/configs/queryClient.js';
import { config } from '@/configs/wagmiClient.js';
import { privySolanaProvider } from '@/connectors/PrivySolanaWalletAdapter.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { setNavigationState } from '@/helpers/navigationState.js';
import { normalizeDecimalInput } from '@/helpers/normalizeDecimalInput.js';
import { resolveEvmConnector, switchEvmConnectorChain } from '@/helpers/resolveEvmConnector.js';
import { resolveSwapEvmSigningWallet } from '@/helpers/swap/resolveSwapSigningWallet.js';
import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';
import { useAutoHeightTextarea } from '@/hooks/useAutoHeightTextarea.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
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
        <div className="box-border flex h-screen flex-col">
            <NavigationBar onBack={() => navigate('/', { replace: true })}>
                <Trans>Send</Trans>
            </NavigationBar>
            <div className="no-scrollbar min-h-0 overflow-auto p-4 pb-0">
                <Form />
            </div>
        </div>
    );
}

function Form() {
    const navigateForm = useNavigate();
    const { handleSubmit, control, register, setValue } = useFormContext<FormValues>();
    const { evmAddress, solanaAddress } = useEmbeddedWalletAddresses();
    const connections = useConnections();

    const evmTransfer = EthereumTransfer;
    const solanaTransfer = useMemo(() => new SolanaTransfer(privySolanaProvider), []);

    const watching = useWatch({ control });
    const { to, amount } = watching;
    const token = watching.token as Token;
    const recipient = watching.recipient as RecipientItemProps | undefined;
    const showRecipient = recipient && !isOnlyAddress(recipient) && recipient?.address === watching.to;
    const networkType = token?.networkType;

    const [isFocusingAddressInput, setIsFocusingAddressInput] = useState(false);

    const toQueryKey = networkType === NetworkType.Ethereum ? (to?.toLowerCase() ?? '') : (to ?? '');
    const tokenQueryKey = token ? { id: token.id, chainId: token.chainId, decimals: token.decimals } : null;

    const account = networkType === NetworkType.Solana ? solanaAddress : evmAddress!;
    const { data: availableBalance, isLoading: isLoadingAvailableBalance } = useQuery({
        queryKey: ['token-available-balance', networkType, tokenQueryKey, account],
        enabled: !!token && !!networkType,
        async queryFn() {
            if (!token || !networkType || !account) return null;
            const transfer = resolveTransferProvider(networkType);
            return transfer.getAvailableBalance({
                to: networkType === NetworkType.Solana ? SOL_ZERO_ADDRESS : ETH_ZERO_ADDRESS,
                token,
                amount: '0',
                account,
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
                        token: token as Token<number, Address>,
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
                    if (!solanaAddress) return null;
                    const transaction = await solanaTransfer.getTransferTransaction({
                        amount,
                        to: to ?? SOL_ZERO_ADDRESS,
                        token,
                    });
                    const latestBlockhash = await solanaTransfer.connection.getLatestBlockhash();
                    transaction.recentBlockhash = latestBlockhash.blockhash;
                    transaction.feePayer = new web3.PublicKey(solanaAddress);
                    const fee = await transaction.getEstimatedFee(solanaTransfer.connection);
                    if (!fee) return null;
                    const price = await coinGeckoEndpoint.getFungibleTokenPrice(
                        solanaMainnetChain.id,
                        SOL_ZERO_ADDRESS,
                    );
                    const formatAmount = removeTrailingZeros(formatLamportsToSol(fee));
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
        queryKey: ['validate-transfer', toQueryKey, amount, tokenQueryKey, availableBalance, estimatedGas?.rawGas],
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

            const balance = availableBalance || token.balance || '0';
            const totalNeeded =
                networkType === NetworkType.Ethereum && isNativeTokenDebank(token) && estimatedGas?.amount
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

    const resolveTransferProvider = useCallback(
        (networkType: NetworkType) => {
            switch (networkType) {
                case NetworkType.Ethereum:
                    return evmTransfer as TransferProvider;
                case NetworkType.Solana:
                    return solanaTransfer;
                default:
                    unreachable(networkType);
            }
        },
        [evmTransfer, solanaTransfer],
    );
    const [{ loading: isSending }, onSubmit] = useAsyncFn(
        async (values: FormValues) => {
            try {
                if (!evmAddress || !solanaAddress) {
                    throw new Error('Wallet not connected');
                }

                const to = values.to;
                const walletAddress = networkType === NetworkType.Ethereum ? evmAddress : solanaAddress;
                const walletType = networkType === NetworkType.Ethereum ? ('evm' as const) : ('sol' as const);
                const recipientType = values.recipient?.source
                    ? ('social_user' as const)
                    : ('onchain_address' as const);

                captureWalletTelemetryEvent(WalletTelemetryEventId.WALLET_TRANSACTION_CALL, {
                    txn_type: 'transfer',
                    firefly_wallet_address: walletAddress,
                    firefly_wallet_type: walletType,
                    use_firefly_transfer: true,
                    recipient_type: recipientType,
                    recipient_social_handle: values.recipient?.handle ?? undefined,
                });

                const transfer = resolveTransferProvider(networkType);
                let connector: Awaited<ReturnType<typeof resolveEvmConnector>> = null;
                let signingWallet: ReturnType<typeof resolveSwapEvmSigningWallet> = null;
                if (networkType === NetworkType.Ethereum) {
                    signingWallet = resolveSwapEvmSigningWallet(connections, evmAddress, {
                        preferEmbedded: true,
                    });
                    if (signingWallet) connector = await resolveEvmConnector(evmAddress, PRIVY_CONNECTOR_ID);
                    if (signingWallet && connector) {
                        await switchEvmConnectorChain(connector, values.token.chainId);
                    }
                }
                const hash = await transfer.transfer({
                    token: values.token,
                    to,
                    amount: values.amount,
                    connector: connector ?? undefined,
                });

                const chainId = values.token.chainId;

                captureWalletTelemetryEvent(WalletTelemetryEventId.WALLET_TRANSACTION_SUBMIT_SUCCESS, {
                    txn_type: 'transfer',
                    txn_hash: hash,
                    firefly_wallet_address: walletAddress,
                    firefly_wallet_type: walletType,
                    chain_id: chainId,
                    target_wallet_address: to,
                    use_firefly_transfer: true,
                    recipient_type: recipientType,
                    recipient_social_handle: values.recipient?.handle ?? undefined,
                    token_symbol: values.token.symbol,
                    token_amount: Number(values.amount),
                });

                captureWalletTelemetryEvent(WalletTelemetryEventId.WALLET_SEND_SUCCESS, {
                    wallet_address: walletAddress,
                    target_wallet_address: to,
                    target_firefly_account_id: values.recipient?.fireflyId ?? undefined,
                    amount: Number(values.amount),
                    currency: values.token.symbol,
                    chain_id: chainId,
                });

                setNavigationState(RoutePath.Success, { ...values, hash });
                navigateForm(RoutePath.Success);
            } catch (error) {
                setNavigationState(RoutePath.Failed, { error });
                navigateForm(RoutePath.Failed);
            }
        },
        [evmAddress, solanaAddress, connections, navigateForm, networkType, resolveTransferProvider],
    );

    useAutoHeightTextarea(() => document.getElementById('send-transaction-recipient') as HTMLTextAreaElement);

    return (
        <form
            className="flex min-h-0 w-full flex-col items-center gap-4 md:rounded-xl"
            onSubmit={handleSubmit((values) => onSubmit(values))}
        >
            <div className="no-scrollbar -mx-px flex min-h-0 w-full grow flex-col gap-3 overflow-y-auto px-px">
                <ClickableButton
                    className="flex w-full items-center justify-between rounded-xl bg-line p-4"
                    onClick={() => navigateForm(RoutePath.SelectToken)}
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
                        <div className="flex flex-col space-y-1 text-left text-medium">
                            <span className="h-[18px] leading-[18px]">{token.name}</span>
                            <span className="h-3.5 text-[13px] leading-[14px] text-second">
                                <Trans>
                                    Balance:{' '}
                                    {isLoadingAvailableBalance ? '...' : availableBalance || token.balance || '0'}{' '}
                                    {token.symbol || '-'}
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
                <div className="relative flex w-full rounded-xl bg-line focus-within:bg-primaryBottom focus-within:ring-1 focus-within:ring-highlight">
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
                        <div className="flex size-9 items-center justify-center rounded-lg border bg-primaryBottom">
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
                            className="no-scrollbar max-h-9 min-h-[18px] flex-1 resize-none border-none bg-transparent p-0 pl-3 text-medium font-medium leading-[18px] text-main placeholder:text-second focus:!shadow-none focus:!outline-none focus:!ring-transparent"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                            placeholder={t`Enter or search for a recipient wallet`}
                        />
                    </label>
                    <ClickableButton
                        onClick={() =>
                            navigateForm(
                                isValidAddress(to)
                                    ? RoutePath.SearchRecipients
                                    : `${RoutePath.SearchRecipients}?keyword=${encodeURIComponent(to || '')}`,
                            )
                        }
                        type="button"
                        className="relative z-10 flex h-full items-center justify-center p-4 pl-0"
                    >
                        <span className="flex size-9 items-center justify-center">
                            <SearchIcon width={18} height={18} />
                        </span>
                    </ClickableButton>
                </div>
                {recipient && isSocialRecipient(recipient) && isSameAddress(recipient.address, to) ? (
                    <div className="flex items-center space-x-3 rounded-2xl border border-current p-3 text-left text-[13px] font-medium leading-5 text-warn">
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
                        className="flex cursor-text items-center rounded-xl bg-line p-4 pl-2 duration-100 focus-within:bg-primaryBottom focus-within:ring-1 focus-within:ring-highlight"
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
                            className="no-spinner h-9 flex-1 border-none bg-transparent p-0 pl-3 text-medium text-main placeholder:font-normal placeholder:text-second focus:!shadow-none focus:!outline-none focus:!ring-transparent"
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
                            className="flex size-9 items-center justify-center text-medium font-semibold uppercase text-highlight"
                        >
                            <Trans>Max</Trans>
                        </ClickableButton>
                    </label>
                </div>
                <div className="flex h-[18px] w-full flex-row justify-between whitespace-nowrap text-sm leading-[18px]">
                    <div className="font-normal text-second">
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
                                className="flex items-center gap-1 text-second"
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
                    loading={isSending}
                    disabled={!!validatedResult?.error || isValidating || !to || !amount || !token}
                >
                    <span className="text-medium">{validatedResult?.error ?? <Trans>Send</Trans>}</span>
                </ActionButton>
            </div>
        </form>
    );
}
