'use client';

import { web3 } from '@coral-xyz/anchor';
import { Trans } from '@lingui/react/macro';
import { delay, safeUnreachable } from '@masknet/kit';
import { type Ref, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { type Address, formatEther } from 'viem';

import type { RecipientItemProps } from '@/components/SendTransactionModal/RecipientItem.js';
import { TokenSelectorModal, type TokenSelectorModalRef } from '@/components/SendTransactionModal/SelectTokenModal.js';
import { SendTransactionModal } from '@/components/SendTransactionModal/SendTransactionModal.js';
import { NetworkType } from '@/constants/enum.js';
import { formatLamportsToSol } from '@/helpers/formatLamportsToSol.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { ETH_ZERO_ADDRESS, SOL_ZERO_ADDRESS } from '@/helpers/isZeroAddress.js';
import { multipliedBy } from '@/helpers/number.js';
import { resolveTransferProvider } from '@/helpers/resolveTokenTransfer.js';
import { resolveWagmiChain } from '@/helpers/resolveWagmiChain.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import type { Token } from '@/hooks/useCustomFungibleTokens.js';
import { useMixesTokens } from '@/hooks/useMixesTokens.js';
import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/index.js';
import { SolanaChainId } from '@/mask_pkgs/web3-shared/solana/index.js';
import { SearchRecipientModalRef } from '@/modals/controls.js';
import { CoinGecko } from '@/providers/coingecko/index.js';
import { getDefaultGas } from '@/providers/ethereum/getDefaultGas.js';
import { SolanaTransfer } from '@/providers/solana/Transfer.js';
import type { Token as TipsToken } from '@/providers/types/Transfer.js';

export interface TransferModalRef {
    onOpen: (token?: Token) => void;
}

export function TransferModal({ ref }: { ref?: Ref<TransferModalRef> }) {
    const [open, setOpen] = useState(false);
    const onClose = useCallback(async () => {
        setOpen(false);
        await delay(300);
        setRecipient(undefined);
        setSelectedToken(undefined);
    }, []);
    const [selectedToken, setSelectedToken] = useState<Token | undefined>();
    const [recipient, setRecipient] = useState<RecipientItemProps | undefined>();
    const networkType = selectedToken?.networkType;
    const { ethereum, solana } = useWalletAccountAll();
    const { tokens, isLoading: isLoadingTokens } = useMixesTokens({
        evmAddress: ethereum.address as Address,
        solanaAddress: solana?.address,
    });
    const tokenSelectorModalRef = useRef<TokenSelectorModalRef>(null);

    const onOpen = useCallback((initialToken?: Token) => {
        const token = initialToken;
        if (!token) {
            tokenSelectorModalRef.current?.onOpen();
            return;
        }
        setSelectedToken(token);
        setOpen(true);
    }, []);

    useImperativeHandle(ref, () => {
        return {
            onOpen,
        };
    }, [onOpen]);

    return (
        <>
            <TokenSelectorModal
                tokens={tokens}
                isLoading={isLoadingTokens}
                ref={tokenSelectorModalRef}
                onSelected={(token) => {
                    setSelectedToken(token);
                    setOpen(true);
                }}
            />
            {selectedToken && networkType ? (
                <SendTransactionModal
                    open={open}
                    contentProps={{
                        recipient,
                        token: selectedToken,
                        async onClickSearch(keyword) {
                            setRecipient(
                                await SearchRecipientModalRef.openAndWaitForClose({
                                    networkType,
                                    keyword,
                                }),
                            );
                        },
                        onClickChangeToken() {
                            tokenSelectorModalRef.current?.onOpen();
                        },
                        async onSubmit(values, token) {
                            const to = values.to;
                            const transfer = resolveTransferProvider(networkType);
                            await transfer.transfer({
                                token,
                                to,
                                amount: values.amount,
                            });
                        },
                        async estimateGas({ to, amount = '0' }, token) {
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
                                    const price = await CoinGecko.getFungibleTokenPrice(chain.id, ETH_ZERO_ADDRESS);
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
                                    const price = await CoinGecko.getFungibleTokenPrice(
                                        SolanaChainId.Mainnet,
                                        SOL_ZERO_ADDRESS,
                                    );
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
                        async validate({ to, amount }, token) {
                            if (!to || !amount) return;
                            switch (networkType) {
                                case NetworkType.Ethereum:
                                    if (!isValidAddressEthereum(to))
                                        return { error: <Trans>This wallet address is invalid</Trans> };
                                    break;
                                case NetworkType.Solana:
                                    if (!isValidAddressSolana(to))
                                        return { error: <Trans>This wallet address is invalid</Trans> };
                                    break;
                                default:
                                    safeUnreachable(networkType);
                            }
                            const transfer = resolveTransferProvider(networkType);
                            const isBalanceValid = await transfer.validateBalance({
                                to,
                                token,
                                amount,
                            });
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
                        async setMaxAmount(token) {
                            const transfer = resolveTransferProvider(networkType);
                            return await transfer.getAvailableBalance({
                                to: ETH_ZERO_ADDRESS,
                                token,
                                amount: '0',
                            });
                        },
                    }}
                    onClose={onClose}
                />
            ) : null}
        </>
    );
}
