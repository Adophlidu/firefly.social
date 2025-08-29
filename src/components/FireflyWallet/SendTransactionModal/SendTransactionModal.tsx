import { web3 } from '@coral-xyz/anchor';
import { DialogTitle } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import {
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
    type HistoryState,
    Navigate,
    Outlet,
    rootRouteId,
    RouterProvider,
    useLocation,
    useMatch,
    useRouter,
} from '@tanstack/react-router';
import { omit, uniq } from 'lodash-es';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form';
import { type Address, formatEther } from 'viem';

import AddIcon from '@/assets/add-circle.svg';
import ArrowDownIcon from '@/assets/arrow-line-down.svg';
import ErrorIcon from '@/assets/error-circle.svg';
import InfoIcon from '@/assets/info-outline.svg';
import LineArrowUp from '@/assets/line-arrow-up.svg';
import SearchIcon from '@/assets/search.svg';
import SuccessIcon from '@/assets/success.svg';
import WalletIcon from '@/assets/wallet.fill.svg';
import { ActionButton } from '@/components/ActionButton.js';
import { ChainIcon } from '@/components/ChainIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { ChooseRecipient } from '@/components/FireflyWallet/SendTransactionModal/ChooseRecipient.js';
import {
    isOnlyAddress,
    isSocialRecipient,
    RecipientItem,
    type RecipientItemProps,
} from '@/components/FireflyWallet/SendTransactionModal/RecipientItem.js';
import { SearchRecipient } from '@/components/FireflyWallet/SendTransactionModal/SearchRecipient.js';
import { BackButton, CloseButton } from '@/components/IconButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Modal } from '@/components/Modal.js';
import { SearchContentPanel } from '@/components/Search/SearchContentPanel.js';
import { TokenIcon } from '@/components/Tips/TokenIcon.js';
import { TokenItem } from '@/components/Tips/TokenItem.js';
import { chains, privyVisibleChains } from '@/configs/chains.js';
import { queryClient } from '@/configs/queryClient.js';
import { NetworkType } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { formatLamportsToSol } from '@/helpers/formatLamportsToSol.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { getErrorMessageFromError } from '@/helpers/getSnackbarMessageFromError.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { ETH_ZERO_ADDRESS, isZeroAddressEthereum, SOL_ZERO_ADDRESS } from '@/helpers/isZeroAddress.js';
import { isGreaterThanOrEqualTo, multipliedBy } from '@/helpers/number.js';
import { resolveTransferProvider } from '@/helpers/resolveTokenTransfer.js';
import { resolveWagmiChain } from '@/helpers/resolveWagmiChain.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { useExpandableTokens } from '@/hooks/useExpandableTokens.js';
import { useMixesTokens } from '@/hooks/useMixesTokens.js';
import { AddCustomERC20ModalRef } from '@/modals/AddCustomERC20Modal.js';
import { CoinGecko } from '@/providers/coingecko/index.js';
import { getDefaultGas } from '@/providers/ethereum/getDefaultGas.js';
import { EthereumNetwork } from '@/providers/ethereum/Network.js';
import { SolanaNetwork } from '@/providers/solana/Network.js';
import { SolanaTransfer } from '@/providers/solana/Transfer.js';
import { captureFireflyWalletEvent } from '@/providers/telemetry/captureFireflyWalletEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';
import type { Token as TipsToken, Token } from '@/providers/types/Transfer.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export function SendTransactionModal({ onClose, open }: { onClose: () => void; open: boolean }) {
    return (
        <Modal
            open={open}
            onClose={() => onClose()}
            className="w-auto max-md:w-[calc(100%-40px)]"
            disableScrollLock={false}
        >
            <div className="relative z-10 flex flex-col rounded-md bg-lightBottom dark:bg-darkBottom md:rounded-xl">
                <SendTransactionModalRouter onClose={onClose} />
            </div>
        </Modal>
    );
}

function SendTransactionModalRouter({ onClose }: { onClose: () => void }) {
    const router = useMemo(() => {
        const memoryHistory = createMemoryHistory({
            initialEntries: [RoutePath.Form, RoutePath.SelectToken],
            initialIndex: 1,
        });
        const routeTree = rootRoute.addChildren([
            formRoute,
            selectTokenRoute,
            searchRecipientRoute,
            chooseRecipientRoute,
            failedRoute,
            successRoute,
        ]);
        return createRouter({
            routeTree,
            history: memoryHistory,
            defaultPendingMinMs: 0,
        });
    }, []);
    return <RouterProvider router={router} context={{ onClose }} />;
}

function Header() {
    const location = useLocation();
    const { context } = useMatch({ from: rootRouteId });
    const router = useRouter();
    if (([RoutePath.Failed, RoutePath.Success] as string[]).includes(location.pathname)) {
        return null;
    }
    return (
        <DialogTitle as="h3" className="relative mb-4 h-10 shrink-0">
            {([RoutePath.ChooseRecipient, RoutePath.SearchRecipients] as string[]).includes(location.pathname) ? (
                <BackButton
                    onClick={() => router.history.back()}
                    className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer text-main"
                />
            ) : (
                <CloseButton
                    onClick={() => context.onClose?.()}
                    className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer text-main"
                />
            )}
            <span className="flex h-full w-full items-center justify-center text-lg font-bold text-main">
                {location.pathname === RoutePath.Form ? <Trans>Send</Trans> : null}
                {location.pathname === RoutePath.SelectToken ? <Trans>Select Token</Trans> : null}
                {location.pathname === RoutePath.SearchRecipients ? <Trans>Recipient</Trans> : null}
                {location.pathname === RoutePath.ChooseRecipient ? <Trans>Choose Wallet</Trans> : null}
            </span>
        </DialogTitle>
    );
}

interface FormValues {
    to: string;
    amount: string;
    token: Token;
    recipient?: RecipientItemProps;
}

function RootView() {
    const location = useLocation();
    const pathname = location.pathname as RoutePath;
    const methods = useForm<FormValues>({
        defaultValues: {
            to: '',
            amount: '',
        },
        mode: 'onChange',
    });

    return (
        <div
            className={classNames('flex w-full flex-col p-6 transition-all will-change-contents', {
                'h-[482px] md:w-[432px]': [RoutePath.SearchRecipients, RoutePath.ChooseRecipient].includes(pathname),
                'h-[482px] md:h-[620px] md:w-[600px]': [RoutePath.SelectToken].includes(pathname),
                'min-h-[482px] md:w-[432px]': [RoutePath.Form].includes(pathname),
                'md:w-[432px]': [RoutePath.Failed, RoutePath.Success].includes(pathname),
            })}
        >
            <Header />
            <FormProvider {...methods}>
                <Outlet />
            </FormProvider>
        </div>
    );
}

function FormView() {
    const router = useRouter();
    const {
        handleSubmit,
        control,
        formState: { isSubmitting, isValid },
        register,
        setValue,
    } = useFormContext<FormValues>();
    const { ethereum, solana } = useWalletAccountAll();
    const onSubmit = async (values: FormValues) => {
        try {
            const to = values.to;
            const transfer = resolveTransferProvider(networkType);
            const hash = await transfer.transfer({
                token: values.token,
                to,
                amount: values.amount,
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
                    return;
            }
            if (!address) return;
            const amountUsd = multipliedBy(values.amount, token.price).toNumber();
            captureFireflyWalletEvent(EventId.FIREFLY_WALLET_SEND_SUCCESS, {
                wallet_address: address,
                target_wallet_address: to,
                target_firefly_account_id: recipient?.handle,
                amount: parseFloat(values.amount),
                currency: token.symbol,
                amount_usd: amountUsd,
                chain_id: token.chainId,
            });
        } catch (error) {
            enqueueErrorMessage(getErrorMessageFromError(error, <Trans>Failed to transfer</Trans>));
            router.navigate({ to: RoutePath.Failed, state: { error } as unknown as HistoryState });
            throw error;
        }
    };

    const watching = useWatch({ control });
    const { to, amount } = watching;
    const token = watching.token as Token;
    const recipient = watching.recipient as RecipientItemProps | undefined;
    const showRecipient = recipient && !isOnlyAddress(recipient) && recipient?.address === watching.to;
    const networkType = token?.networkType;

    const [isFocusingAddressInput, setIsFocusingAddressInput] = useState(false);

    const { data: availableBalance, isLoading: isLoadingAvailableBalance } = useQuery({
        queryKey: ['token-available-balance', networkType, token, to],
        enabled: !!token,
        async queryFn() {
            if (!token || !networkType) return;
            const transfer = resolveTransferProvider(networkType);
            return await transfer.getAvailableBalance({
                to: ETH_ZERO_ADDRESS,
                token,
                amount: '0',
            });
        },
    });

    const { data: validatedResult, isLoading: isValidating } = useQuery({
        queryKey: ['validate-transfer', to, amount, token, availableBalance],
        async queryFn() {
            if (!to || !amount || !token || !networkType || !availableBalance) return;
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
            const transfer = resolveTransferProvider(networkType);
            const isBalanceValid = isGreaterThanOrEqualTo(availableBalance, amount);
            if (!isBalanceValid) {
                return { error: <Trans>Insufficient Balance</Trans> };
            }
            const isGasValid = await transfer.validateGas({
                to,
                token,
                amount,
            });
            if (isGasValid) return;
            return { error: <Trans>Insufficient Gas</Trans> };
        },
        enabled: Boolean(to && amount && token && networkType && availableBalance),
    });

    const { data: estimatedGas, isLoading: isEstimatingGas } = useQuery({
        queryKey: ['estimateGas', token, networkType, to, amount],
        async queryFn() {
            if (!to || !amount || !token || !networkType) return;
            switch (networkType) {
                case NetworkType.Ethereum: {
                    if (!isValidAddressEthereum(to)) return;
                    const { gas } = await getDefaultGas({
                        token: token as TipsToken<EthereumChainId, Address>,
                        to,
                        amount,
                    });
                    const chain = resolveWagmiChain(token.chainId);
                    if (!chain) return;
                    const price = await queryClient.ensureQueryData({
                        queryKey: ['fungible', 'token-price', chain.id, ETH_ZERO_ADDRESS],
                        queryFn: () => CoinGecko.getFungibleTokenPrice(chain.id, ETH_ZERO_ADDRESS),
                    });
                    const formatAmount = formatEther(BigInt(gas.toString()));
                    const usd = multipliedBy(price ?? 0, formatAmount).toString();
                    return {
                        amount: formatAmount,
                        usd,
                        symbol: chain.nativeCurrency.symbol,
                    };
                }
                case NetworkType.Solana: {
                    if (!solana.address) return;
                    const transaction = await SolanaTransfer.getTransferTransaction({
                        amount,
                        to: to ?? SOL_ZERO_ADDRESS,
                        token,
                    });
                    const latestBlockhash = await SolanaTransfer.connection.getLatestBlockhash();
                    transaction.recentBlockhash = latestBlockhash.blockhash;
                    transaction.feePayer = new web3.PublicKey(solana.address);
                    const fee = await transaction.getEstimatedFee(SolanaTransfer.connection);
                    if (!fee) return;
                    const price = await CoinGecko.getFungibleTokenPrice(SolanaChainId.Mainnet, SOL_ZERO_ADDRESS);
                    const formatAmount = formatLamportsToSol(fee);
                    const usd = multipliedBy(price ?? 0, formatAmount).toString();
                    return {
                        amount: formatAmount,
                        usd,
                        symbol: 'SOL',
                    };
                }
                default:
                    safeUnreachable(networkType);
                    return;
            }
        },
        enabled: !!token,
    });

    useLayoutEffect(() => {
        const textareaEl = document.getElementById('send-transaction-recipient') as HTMLTextAreaElement;
        if (!textareaEl) return;
        function adjustTextareaHeight() {
            const el = textareaEl;
            el.style.height = '1px';
            el.style.height = `${el.scrollHeight}px`;
        }
        adjustTextareaHeight();
        textareaEl.addEventListener('input', adjustTextareaHeight);
        textareaEl.addEventListener('change', adjustTextareaHeight);
        textareaEl.addEventListener('focus', adjustTextareaHeight);
        textareaEl.addEventListener('blur', adjustTextareaHeight);
        return () => {
            textareaEl.removeEventListener('input', adjustTextareaHeight);
            textareaEl.removeEventListener('change', adjustTextareaHeight);
            textareaEl.removeEventListener('focus', adjustTextareaHeight);
            textareaEl.removeEventListener('blur', adjustTextareaHeight);
        };
    }, []);

    if (!token) {
        return <Navigate to={RoutePath.SelectToken} />;
    }

    return (
        <form
            className="flex w-full flex-col items-center gap-4 bg-lightBottom dark:bg-darkBottom md:rounded-xl"
            onSubmit={handleSubmit((values) => onSubmit(values))}
        >
            <div className="flex w-full flex-col items-start space-y-3">
                <ClickableButton
                    className="flex w-full items-center justify-between rounded-xl bg-line p-4"
                    onClick={() => router.navigate({ to: RoutePath.SelectToken })}
                >
                    <div className="flex items-center gap-x-4">
                        <TokenIcon token={token} tokenSize={36} />
                        <div className="flex flex-col space-y-1 text-left text-medium">
                            <span className="h-[18px] leading-[18px]">{token.name}</span>
                            <span className="h-3.5 text-[13px] leading-[14px] text-second">
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
                <div className="relative flex w-full rounded-xl bg-line focus-within:bg-primaryBottom focus-within:ring-1 focus-within:ring-highlight">
                    {showRecipient && recipient ? (
                        <div
                            className={classNames(
                                'pointer-events-none absolute left-0 top-0 flex w-full cursor-text p-4 duration-100',
                                {
                                    'opacity-0': isFocusingAddressInput,
                                },
                            )}
                        >
                            <RecipientItem {...(omit(recipient, 'handle', 'tag') as RecipientItemProps)} />
                        </div>
                    ) : null}
                    <label
                        htmlFor="send-transaction-recipient"
                        className={classNames('flex w-full min-w-0 cursor-text items-center p-4 pr-0 duration-100', {
                            'opacity-0': !!showRecipient && !isFocusingAddressInput,
                        })}
                    >
                        <div className="border-line2 flex size-9 items-center justify-center rounded-lg border bg-primaryBottom">
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
                            className="max-h-9 min-h-[18px] flex-1 resize-none border-none bg-transparent p-0 pl-3 text-medium font-medium leading-[18px] text-main placeholder:text-second focus:!shadow-none focus:!outline-none focus:!ring-transparent"
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
                    <div className="flex items-center space-x-3 rounded-2xl border border-current p-3 text-left text-[13px] font-medium leading-5 text-warn">
                        <InfoIcon width={24} height={24} className="shrink-0" />
                        <div>
                            <Trans>
                                Please note that the wallet address related to social account may be inaccurate or
                                subject to change. Be sure to verify the address before sending.
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
                            type="number"
                            {...register('amount', {
                                required: true,
                            })}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                            step="any"
                            min={0}
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
                    {estimatedGas || isEstimatingGas ? (
                        <>
                            <div className="font-normal text-second">
                                <Trans>Network cost</Trans>
                            </div>
                            <div
                                className={classNames('font-medium', {
                                    'animate-pulse rounded bg-bg': isEstimatingGas,
                                })}
                            >
                                {isEstimatingGas ? null : estimatedGas ? (
                                    <>
                                        {renderShrankPrice(formatPrice(estimatedGas.amount) ?? '-')} $
                                        {estimatedGas.symbol} ≈ $
                                        {renderShrankPrice(formatPrice(estimatedGas.usd) ?? '-')}
                                    </>
                                ) : (
                                    '-'
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
            <div className="mt-auto w-full">
                <ActionButton
                    className="h-10 w-full rounded-lg text-medium"
                    type="submit"
                    disabled={isSubmitting || !!validatedResult?.error || isValidating || isEstimatingGas || !isValid}
                >
                    {isValidating || isSubmitting ? (
                        <LoadingIcon size={20} />
                    ) : (
                        (validatedResult?.error ?? <Trans>Send</Trans>)
                    )}
                </ActionButton>
            </div>
        </form>
    );
}

function SelectTokenView() {
    const router = useRouter();
    const [chainId, setChainId] = useState<number>();
    const [keyword, setKeyword] = useState('');

    const { ethereum, solana } = useWalletAccountAll();
    const { tokens, isLoading } = useMixesTokens({
        evmAddress: ethereum.address as Address,
        solanaAddress: solana?.address,
    });

    const {
        tokens: data,
        setShowSmall,
        canExpand,
        showSmall,
    } = useExpandableTokens(tokens, {
        chainId,
        keyword,
    });
    const chainIds = uniq(tokens.map((token) => token.chainId));
    const getChainItem = useCallback((chainId: number, isTag?: boolean) => {
        const chain = chains.find((chain) => chain.id === chainId);
        const isSolana = chainId === SolanaChainId.Mainnet;
        return (
            <div className="flex items-center gap-2">
                {chain || isSolana ? (
                    <>
                        <ChainIcon
                            size={15}
                            chainId={chainId}
                            networkType={isSolana ? NetworkType.Solana : NetworkType.Ethereum}
                        />
                        {isTag ? null : <span>{isSolana ? 'Solana' : chain?.name}</span>}
                    </>
                ) : (
                    `${chainId}`
                )}
            </div>
        );
    }, []);

    const { setValue } = useFormContext<FormValues>();

    const onSelectedToken = useCallback(
        (token: Token) => {
            setValue('token', token);
            setValue('amount', '', {
                shouldValidate: true,
            });
            router.navigate({ to: RoutePath.Form });
        },
        [router, setValue],
    );

    return (
        <div className="min-h-0 flex-1">
            <ClickableButton
                className="text-md absolute right-6 top-8 flex cursor-pointer items-center space-x-2 text-main"
                onClick={() => {
                    AddCustomERC20ModalRef.open({
                        initialChainId: chainId,
                    });
                }}
            >
                <AddIcon width={24} height={24} className="size-6 shrink-0 text-highlight" />
            </ClickableButton>
            <SearchContentPanel
                isLoading={isLoading}
                placeholder={t`Search token`}
                filterProps={{
                    placeholder: t`All chains`,
                    data: chainIds.length ? chainIds : privyVisibleChains.map((c) => c.id),
                    popoverClassName: 'w-[150px]',
                    itemRenderer: (chainId, isTag) => getChainItem(chainId, isTag),
                    isSelected: (item, current) => item === current,
                    selected: chainId,
                    onSelected: setChainId,
                }}
                keyword={keyword}
                onSearch={setKeyword}
                data={data as Token[]}
                itemRenderer={getTokenItem}
                onSelected={onSelectedToken}
                listKey={(token) => `${token.id}-${token.chainId}`}
            >
                {canExpand ? (
                    <ClickableButton
                        className="mt-2 flex w-full items-center justify-center gap-0.5 rounded-lg py-2 text-sm font-bold text-highlight hover:scale-[0.98] hover:bg-lightBg"
                        onClick={() => setShowSmall((prev) => !prev)}
                    >
                        <span>
                            {showSmall ? <Trans>Hide assets &lt; 1 USD</Trans> : <Trans>Show assets &lt; 1 USD</Trans>}
                        </span>
                        <LineArrowUp width={20} height={20} className={showSmall ? '' : 'rotate-180'} />
                    </ClickableButton>
                ) : null}
            </SearchContentPanel>
        </div>
    );
}

function SearchRecipientView() {
    const { search } = useLocation();
    const { control, setValue } = useFormContext<FormValues>();
    const token = useWatch({ control, name: 'token' });
    const router = useRouter();
    return (
        <SearchRecipient
            networkType={token.networkType}
            initialKeyword={search.keyword}
            onClick={(recipient) => {
                if (isZeroAddressEthereum(recipient.address)) {
                    router.navigate({
                        to: RoutePath.ChooseRecipient,
                        state: { recipient } as unknown as HistoryState,
                    });
                    return;
                }
                setValue('recipient', recipient);
                setValue('to', recipient.address, {
                    shouldValidate: true,
                });
                router.navigate({
                    to: RoutePath.Form,
                    replace: true,
                });
            }}
        />
    );
}

function ChooseRecipientView() {
    const { setValue, control } = useFormContext<FormValues>();
    const token = useWatch({ control, name: 'token' });
    const { state } = useLocation();
    const recipient = (state as unknown as { recipient: RecipientItemProps }).recipient;
    const router = useRouter();
    if (!state || !isSocialRecipient(recipient)) {
        return <Navigate to={RoutePath.Form} />;
    }
    return (
        <ChooseRecipient
            recipient={recipient}
            networkType={token.networkType}
            onClick={(recipient) => {
                setValue('recipient', recipient);
                setValue('to', recipient.address);
                router.navigate({ to: RoutePath.Form });
            }}
        />
    );
}

function FailedView() {
    const router = useRouter();
    return (
        <div className="flex h-full w-full flex-col justify-between pt-6">
            <div className="flex flex-col items-center gap-4 bg-lightBottom pb-6 dark:bg-darkBottom">
                <ErrorIcon width={64} height={64} />
                <p className="text-2xl font-semibold text-main">
                    <Trans>Transaction failed</Trans>
                </p>
            </div>
            <ActionButton
                className="mt-12 h-10 w-full rounded-lg text-medium"
                onClick={() => {
                    router.navigate({ to: RoutePath.Form });
                }}
            >
                <Trans>Try again</Trans>
            </ActionButton>
        </div>
    );
}

function SuccessView() {
    const { context } = useMatch({ from: rootRouteId });
    const location = useLocation();
    const state = location.state as unknown as FormValues & { hash: string };
    if (!state.token) {
        return <Navigate to={RoutePath.Form} />;
    }
    const { token, recipient, amount, to, hash } = state;
    return (
        <div className="flex h-full w-full flex-col justify-between pt-6">
            <div className="flex flex-col items-center space-y-4 bg-lightBottom pb-6 dark:bg-darkBottom">
                <SuccessIcon width={64} height={64} className="shrink-0" />
                <p className="text-2xl font-semibold text-main">
                    <Trans>Transaction completed!</Trans>
                </p>
            </div>
            <div className="relative w-full">
                <div className="mb-2 flex w-full items-center justify-between rounded-2xl bg-bg px-4 py-6">
                    <div className="flex items-center gap-x-4">
                        <TokenIcon token={token} tokenSize={36} />
                        <div className="flex flex-col space-y-1 text-left">
                            <span className="h-[18px] text-lg font-semibold leading-[18px]">{token.symbol}</span>
                            <span className="h-3.5 text-sm leading-[14px] text-second">
                                <Trans>Send</Trans>
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end justify-center space-y-1">
                        <div className="h-[18px] text-lg font-semibold leading-[18px]">{formatPrice(amount)}</div>
                        <div className="text-sm text-second">${multipliedBy(token.price, amount).toFormat()}</div>
                    </div>
                </div>
                <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-2 border-primaryBottom bg-bg">
                    <ArrowDownIcon className="text-main" width={24} height={24} />
                </div>
                <div className="w-full rounded-2xl bg-bg px-4 py-6">
                    <RecipientItem
                        {...(recipient ? (omit(recipient, 'handle', 'tag') as RecipientItemProps) : { address: to })}
                    />
                </div>
            </div>

            <div className="flex w-full space-x-2">
                <ActionButton
                    variant="secondary"
                    className="mt-12 h-10 w-full rounded-lg border-none bg-secondaryLine text-medium"
                    onClick={() => {
                        const href = (
                            token.chainId === SolanaChainId.Mainnet ? SolanaNetwork : EthereumNetwork
                        ).getTransactionUrl(token.chainId as never, hash as `0x${string}`);
                        window.open(href, '_blank');
                    }}
                >
                    <Trans>See details</Trans>
                </ActionButton>
                <ActionButton
                    className="mt-12 h-10 w-full rounded-lg text-medium"
                    onClick={() => {
                        context.onClose?.();
                    }}
                >
                    <Trans>Done</Trans>
                </ActionButton>
            </div>
        </div>
    );
}

function getTokenItem(token: Token) {
    return <TokenItem key={token.id} token={token} />;
}

enum RoutePath {
    Form = '/',
    SelectToken = '/tokens',
    SearchRecipients = '/recipients',
    ChooseRecipient = '/recipient/choose',
    Failed = '/failed',
    Success = '/success',
}

const rootRoute = createRootRoute({
    component: RootView,
});

const formRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: RoutePath.Form,
    component: FormView,
});

const selectTokenRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: RoutePath.SelectToken,
    component: SelectTokenView,
});

const searchRecipientRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: RoutePath.SearchRecipients,
    component: SearchRecipientView,
});

const chooseRecipientRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: RoutePath.ChooseRecipient,
    component: ChooseRecipientView,
});

const failedRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: RoutePath.Failed,
    component: FailedView,
});

const successRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: RoutePath.Success,
    component: SuccessView,
});
