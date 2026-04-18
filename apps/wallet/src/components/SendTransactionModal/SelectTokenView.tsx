import AddIcon from '@dimensiondev/assets/add-circle.svg';
import LineArrowUp from '@dimensiondev/assets/line-arrow-up.svg';
import { solana, visibleChains } from '@dimensiondev/web3/chains';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useRouter } from '@tanstack/react-router';
import { uniq } from 'lodash-es';
import { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { toHex } from 'viem';

import { AddCustomERC20Modal } from '@/components/AddCustomERC20Modal.js';
import { ChainIcon } from '@/components/ChainIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { type FormValues, RoutePath } from '@/components/SendTransactionModal/types.js';
import { TokenItem } from '@/components/TokenItem.js';
import { Button } from '@/components/ui/button.js';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select.js';
import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { useExpandableTokens } from '@/hooks/useExpandableTokens.js';
import { useMultiChainTokens } from '@/hooks/useMultiChainTokens.js';

export function SelectTokenView() {
    const [chainId, setChainId] = useState<number>();
    const [keyword, setKeyword] = useState('');
    const { data: rawData, isLoading } = useMultiChainTokens();
    const data = useMemo(
        () => rawData?.tokenAssets?.map((token) => formatTokenFromFireflyTokenAsset(token)) ?? [],
        [rawData],
    );
    const { tokens, canExpand, showSmall, setShowSmall } = useExpandableTokens(data, {
        keyword,
        chainId,
    });

    const chainIds = uniq(data.map((token) => token.chainId));
    const selectableChains = useMemo(() => {
        if (chainIds.length) {
            return chainIds.map((id) => ({
                id,
                name: id === solana.id ? 'Solana' : visibleChains.find((chain) => chain.id === id)?.name || '',
            }));
        }
        return [
            ...visibleChains.map((chain) => ({
                id: chain.id,
                name: chain.name,
            })),
            {
                id: solana.id,
                name: 'Solana',
            },
        ];
    }, [chainIds]);

    const { setValue } = useFormContext<FormValues>();
    const router = useRouter();

    return (
        <div className="flex w-full flex-col px-6 pb-6">
            <div className="relative flex items-center justify-center py-6">
                <h2 className="text-main text-lg font-semibold">
                    <Trans>Select Token</Trans>
                </h2>
                <AddButton />
            </div>
            {isLoading ? (
                <div className="flex w-full flex-1 items-center justify-center py-20">
                    <LoadingIcon />
                </div>
            ) : (
                <div className="relative flex w-full flex-col">
                    <div className="bg-lightBottom dark:bg-darkBottom sticky top-20 z-10 flex items-center space-x-2.5 pb-2">
                        <Select
                            onValueChange={(value) => {
                                if (value === 'None') {
                                    setChainId(undefined);
                                    return;
                                }
                                setChainId(parseInt(value, 16) as number);
                            }}
                        >
                            <SelectTrigger className="w-auto max-w-[150px]">
                                {chainId ? (
                                    <ChainIcon chainId={chainId} size={15} className="mr-1" />
                                ) : (
                                    <span className="text-xs">
                                        <Trans>All Chains</Trans>
                                    </span>
                                )}
                            </SelectTrigger>
                            <SelectContent viewPortClassName="px-0 py-3 space-y-2" className="w-[180px]">
                                <SelectItem
                                    value="None"
                                    className="text-main hover:bg-lightBg cursor-pointer px-3 py-1 text-xs opacity-50"
                                >
                                    <span>
                                        <Trans>All Chains</Trans>
                                    </span>
                                </SelectItem>
                                {selectableChains.map((chain) => (
                                    <SelectItem
                                        value={toHex(chain.id)}
                                        key={chain.id}
                                        className="hover:bg-lightBg cursor-pointer px-3 py-1"
                                    >
                                        <span className="flex items-center text-xs">
                                            <ChainIcon chainId={chain.id} className="mr-2" size={15} />
                                            {chain.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input
                            autoComplete="off"
                            spellCheck="false"
                            className="bg-lightBg text-main placeholder:text-secondary h-10 w-full rounded-lg border-0 px-3 py-1.5 focus:border-0 focus:outline-0 focus:ring-0 sm:text-sm sm:leading-6 dark:bg-[rgba(255,255,255,0.12)]"
                            type="search"
                            value={keyword}
                            name="searchText"
                            placeholder={t`Search token`}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                    </div>
                    <div className="w-full space-y-2">
                        {tokens.length ? (
                            tokens.map((token) => (
                                <TokenItem
                                    token={token}
                                    key={`${token.chainId}-${token.id}`}
                                    className="hover:bg-bg duration-100"
                                    onClick={() => {
                                        setValue('token', token);
                                        setValue('amount', '', {
                                            shouldValidate: true,
                                        });
                                        router.navigate({ to: RoutePath.Form });
                                    }}
                                />
                            ))
                        ) : (
                            <NoResultsFallback
                                className="py-8"
                                message={keyword ? <Trans>No tokens found</Trans> : <Trans>No tokens available</Trans>}
                            />
                        )}
                        {tokens.length && canExpand ? (
                            <ClickableButton
                                className="text-highlight hover:bg-lightBg mt-2 flex w-full items-center justify-center gap-0.5 rounded-lg py-2 text-sm font-bold"
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
                    </div>
                </div>
            )}
        </div>
    );
}

function AddButton() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <AddCustomERC20Modal open={open} onClose={() => setOpen(false)} />
            <Button
                variant="ghost"
                size="icon"
                className="text-highlight absolute right-0 top-1/2 size-8 -translate-y-1/2 [&_svg]:size-6"
                onClick={() => setOpen(true)}
            >
                <AddIcon width={24} height={24} />
            </Button>
        </>
    );
}
