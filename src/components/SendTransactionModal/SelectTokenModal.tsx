'use client';

import { DialogTitle } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { uniq } from 'lodash-es';
import { type Ref, useCallback, useImperativeHandle, useMemo, useState } from 'react';

import AddIcon from '@/assets/add-circle.svg';
import LineArrowUp from '@/assets/line-arrow-up.svg';
import { ChainIcon } from '@/components/ChainIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { Modal } from '@/components/Modal.js';
import { SearchContentPanel } from '@/components/Search/SearchContentPanel.js';
import { TokenItem } from '@/components/Tips/TokenItem.js';
import { chains } from '@/configs/wagmiClient.js';
import { NetworkType } from '@/constants/enum.js';
import { isGreaterThan, isLessThan } from '@/helpers/number.js';
import { useBodyLock } from '@/hooks/useBodyLock.js';
import { type Token, useCustomFungibleTokens } from '@/hooks/useCustomFungibleTokens.js';
import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/index.js';
import { SolanaChainId } from '@/mask_pkgs/web3-shared/solana/index.js';
import { AddCustomERC20ModalRef } from '@/modals/controls.js';

export interface TokenSelectorModalRef {
    onOpen: () => void;
}

interface Props<T extends Token> {
    tokens: T[];
    isLoading?: boolean;
    onSelected?: (token: T) => void;
    ref?: Ref<TokenSelectorModalRef>;
}

export function TokenSelectorModal<T extends Token>({ tokens, isLoading, onSelected, ref }: Props<T>) {
    const [open, setOpen] = useState(false);
    const onClose = useCallback(() => setOpen(false), []);
    const [chainId, setChainId] = useState<number>();
    const [keyword, setKeyword] = useState('');
    useBodyLock(open);

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
    const isSolana = chainId === SolanaChainId.Mainnet;
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
                        {isTag ? null : <span>{isSolana ? <Trans>Solana</Trans> : chain?.name}</span>}
                    </>
                ) : (
                    `${chainId}`
                )}
            </div>
        );
    }, []);

    useImperativeHandle(ref, () => {
        return {
            onOpen: () => setOpen(true),
        };
    }, [setOpen]);

    const onSelectedToken = useCallback(
        (token: T) => {
            onSelected?.(token);
            onClose();
        },
        [onClose, onSelected],
    );

    return (
        <Modal open={open} onClose={onClose} dialogClassName="z-50">
            <div className="z-50 flex h-[70vh] w-4/5 flex-col rounded-md bg-lightBottom p-6 text-medium text-lightMain shadow-popover transition-all dark:bg-darkBottom md:h-[620px] md:w-[600px] md:rounded-xl">
                <DialogTitle as="h3" className="relative mb-4 h-10 shrink-0 pt-safe">
                    <CloseButton
                        onClick={onClose}
                        className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer text-main"
                    />
                    <span className="flex h-full w-full items-center justify-center text-lg font-bold text-main">
                        <Trans>Select Token</Trans>
                    </span>
                    {!isSolana ? (
                        <ClickableButton
                            className="text-md absolute right-0 top-1/2 flex -translate-y-1/2 cursor-pointer items-center space-x-2 text-main"
                            onClick={() => {
                                AddCustomERC20ModalRef.open({
                                    initialChainId: chainId ?? EthereumChainId.Mainnet,
                                });
                            }}
                        >
                            <AddIcon width={24} height={24} className="size-6 shrink-0 text-highlight" />
                        </ClickableButton>
                    ) : null}
                </DialogTitle>
                <div className="min-h-0 flex-1">
                    <SearchContentPanel<T, number>
                        isLoading={isLoading}
                        placeholder={t`Search token`}
                        filterProps={{
                            placeholder: t`All chains`,
                            data: chainIds,
                            popoverClassName: 'w-[150px]',
                            itemRenderer: (chainId, isTag) => getChainItem(chainId, isTag),
                            isSelected: (item, current) => item === current,
                            selected: chainId,
                            onSelected: setChainId,
                        }}
                        keyword={keyword}
                        onSearch={setKeyword}
                        data={data as T[]}
                        itemRenderer={getTokenItem}
                        onSelected={onSelectedToken}
                        listKey={(token) => `${token.id}-${token.chainId}`}
                    >
                        {canExpand ? (
                            <ClickableButton
                                className="mt-2 flex w-full items-center justify-center gap-0.5 rounded-lg py-2 text-sm font-bold text-highlight hover:bg-lightBg"
                                onClick={() => setShowSmall((prev) => !prev)}
                            >
                                <span>
                                    {showSmall ? (
                                        <Trans>Hide assets &lt; 1 USD</Trans>
                                    ) : (
                                        <Trans>Show assets &lt; 1 USD</Trans>
                                    )}
                                </span>
                                <LineArrowUp width={20} height={20} className={showSmall ? '' : 'rotate-180'} />
                            </ClickableButton>
                        ) : null}
                    </SearchContentPanel>
                </div>
            </div>
        </Modal>
    );
}

function getTokenItem(token: Token) {
    return <TokenItem key={token.id} token={token} />;
}

export function useExpandableTokens(
    tokens: Token[],
    options?: {
        chainId?: number;
        keyword?: string;
    },
) {
    const chainId = options?.chainId;
    const keyword = options?.keyword;
    const [showSmall, setShowSmall] = useState(false);
    const customTokens = useCustomFungibleTokens();
    const filteredTokens: Token[] = useMemo(() => {
        let allTokens = [...customTokens, ...tokens];
        if (chainId) {
            allTokens = allTokens.filter((token) => token.chainId === chainId);
        }
        if (keyword) {
            const kw = keyword.toLocaleLowerCase();
            allTokens = allTokens.filter((token) =>
                [token.name, token.symbol, token.id].some((value) => value.toLowerCase().includes(kw)),
            );
        }
        return allTokens;
    }, [chainId, keyword, tokens, customTokens]);
    const canExpand = useMemo(() => {
        if (keyword || chainId) return false;
        return (
            filteredTokens.some((token) => isGreaterThan(token.usdValue, 1) && !token.custom) &&
            filteredTokens.some((token) => isLessThan(token.usdValue, 1) && !token.custom)
        );
    }, [chainId, filteredTokens, keyword]);

    const highValueTokens = filteredTokens.filter((token) => (token.custom ? true : isGreaterThan(token.usdValue, 1)));
    const lowValueTokens = filteredTokens.filter((token) => (token.custom ? false : isLessThan(token.usdValue, 1)));

    const data = showSmall || !canExpand ? [...highValueTokens, ...lowValueTokens] : highValueTokens;

    return {
        tokens: data,
        setShowSmall,
        canExpand,
        showSmall,
    };
}
