import ComebackIcon from '@dimensiondev/assets/comeback2.svg';
import LineArrowUp from '@dimensiondev/assets/line-arrow-up.svg';
import { solana, visibleChains } from '@dimensiondev/web3/chains';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import { uniq } from 'lodash-es';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { ChainIcon } from '@/components/ChainIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { type FormValues, RoutePath, useSendToken } from '@/components/SendTransactionModal/types.js';
import { TokenItem } from '@/components/TokenItem.js';
import { Button } from '@/components/ui/button.js';
import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { useExpandableTokens } from '@/hooks/useExpandableTokens.js';
import { useMultiChainTokens } from '@/hooks/useMultiChainTokens.js';

const sendTokensSearchSchema = z.object({
    chain: z.coerce.number().optional(),
    token: z.string().optional(),
    to: z.string().optional(),
    amount: z.string().optional(),
});

function ChainFilterDropdown({
    chainId,
    onChainChange,
    selectableChains,
}: {
    chainId?: number;
    onChainChange: (chainId?: number) => void;
    selectableChains: Array<{ id: number; name: string }>;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
            setOpen(false);
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, handleClickOutside]);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                className="border-line flex h-10 w-auto max-w-[150px] items-center justify-between whitespace-nowrap rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm"
                onClick={() => setOpen((prev) => !prev)}
            >
                {chainId ? (
                    <ChainIcon chainId={chainId} size={15} className="mr-1" />
                ) : (
                    <span className="text-xs">
                        <Trans>All Chains</Trans>
                    </span>
                )}
                <svg
                    className="ml-1 size-4 opacity-50"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>
            {open ? (
                <div className="border-line bg-primaryBottom absolute left-0 top-full z-50 mt-1 w-[180px] rounded-md border py-3 shadow-md">
                    <button
                        type="button"
                        className="text-main hover:bg-lightBg w-full cursor-pointer px-3 py-1 text-left text-xs opacity-50"
                        onClick={() => {
                            onChainChange(undefined);
                            setOpen(false);
                        }}
                    >
                        <Trans>All Chains</Trans>
                    </button>
                    {selectableChains.map((chain) => (
                        <button
                            type="button"
                            key={chain.id}
                            className="hover:bg-lightBg flex w-full cursor-pointer items-center px-3 py-1 text-left"
                            onClick={() => {
                                onChainChange(chain.id);
                                setOpen(false);
                            }}
                        >
                            <span className="flex items-center text-xs">
                                <ChainIcon chainId={chain.id} className="mr-2" size={15} />
                                {chain.name}
                            </span>
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

export const Route = createFileRoute('/send/tokens')({
    validateSearch: sendTokensSearchSchema,
    component: SelectTokenPage,
});

function SelectTokenPage() {
    const search = Route.useSearch();
    const [chainId, setChainId] = useState<number | undefined>(() => search.chain);
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
    const { setToken } = useSendToken();
    const router = useRouter();
    const navigate = useNavigate();
    const didAutoAdvance = useRef(false);

    useEffect(() => {
        if (didAutoAdvance.current || isLoading || !search.token || !data.length) return;
        const wantChain = search.chain;
        const wantToken = search.token.toLowerCase();
        const match = data.find(
            (t) => (!wantChain || t.chainId === wantChain) && String(t.id).toLowerCase() === wantToken,
        );
        if (!match) return;
        didAutoAdvance.current = true;
        setToken(match);
        setValue('token', match);
        setValue('to', search.to ?? '', { shouldValidate: true });
        setValue('amount', search.amount ?? '', { shouldValidate: true });
        router.navigate({ to: RoutePath.Form });
    }, [data, isLoading, router, search.amount, search.chain, search.to, search.token, setToken, setValue]);

    return (
        <div className="flex w-full flex-col pb-6">
            <div className="bg-primaryBottom sticky top-0 z-10 px-6">
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
                        <Trans>Select Token</Trans>
                    </h2>
                </div>
                <div className="flex items-center space-x-2.5 pb-2">
                    <ChainFilterDropdown
                        chainId={chainId}
                        onChainChange={setChainId}
                        selectableChains={selectableChains}
                    />
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
            </div>
            {isLoading ? (
                <div className="flex w-full flex-1 items-center justify-center py-20">
                    <LoadingIcon />
                </div>
            ) : (
                <div className="w-full space-y-2 px-6">
                    {tokens.length ? (
                        tokens.map((token) => (
                            <TokenItem
                                token={token}
                                key={`${token.chainId}-${token.id}`}
                                className="hover:bg-bg duration-100"
                                onClick={() => {
                                    setToken(token);
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
            )}
        </div>
    );
}
