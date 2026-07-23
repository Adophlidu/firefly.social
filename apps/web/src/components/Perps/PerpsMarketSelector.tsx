'use client';

import ArrowDownIcon from '@dimensiondev/assets/arrow-down.svg';
import SearchIcon from '@dimensiondev/assets/search.svg';
import { classNames } from '@dimensiondev/utils';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import {
    filterAndOrderPerpsMarkets,
    type PerpsMarketCategory,
    resolvePerpsMarketIconUrl,
    toPerpsCoinDisplayName,
    toPerpsMarketDisplayName,
    toRawPerpsMarketName,
} from '@/components/Perps/marketSelection.js';
import { PerpsFavoriteButton } from '@/components/Perps/PerpsFavoriteButton.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { openLoginModalWithGuard } from '@/controllers/openLoginModal.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { getPerpsCategories } from '@/providers/firefly/perps/getPerpsCategories.js';
import { getPerpsTokens } from '@/providers/firefly/perps/getPerpsTokens.js';
import {
    createPerpsFavorite,
    getPerpsFavorites,
    type PerpsFavorite,
    removePerpsFavorite,
} from '@/providers/firefly/perps/perpsFavorites.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

interface PerpsMarketItem {
    coin: string;
    maxLeverage?: number;
    lastPrice?: string;
    priceChangeRatio?: number;
    fundingRate?: string;
    volume?: string;
    openInterest?: string;
}

interface Props {
    markets: PerpsMarketItem[];
    selectedCoin: string;
    leverage?: string;
    onSelect: (coin: string) => void;
}

function formatPrice(value?: string) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '--';
    return number.toLocaleString(undefined, { maximumFractionDigits: number >= 1 ? 4 : 6 });
}

function formatUsd(value?: string) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '--';
    return `$${Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(number)}`;
}

function formatPercent(value?: number) {
    if (value === undefined || !Number.isFinite(value)) return '--';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatFunding(value?: string) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '--';
    return `${(number * 100).toFixed(4)}%`;
}

export const PerpsMarketSelector = memo(function PerpsMarketSelector({
    markets,
    selectedCoin,
    leverage,
    onSelect,
}: Props) {
    const queryClient = useQueryClient();
    const currentProfileSession = useFireflyProfileStore.use.currentProfileSession();
    const profileId = currentProfileSession?.profileId;
    const selectedMarketDisplayName = toPerpsMarketDisplayName(selectedCoin);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<PerpsMarketCategory>('all');
    const categoriesQuery = useQuery({
        queryKey: ['perps', 'categories'],
        queryFn: getPerpsCategories,
        staleTime: 60 * 60 * 1000,
    });
    const tokensQuery = useQuery({
        queryKey: ['perps', 'category-tokens'],
        queryFn: getPerpsTokens,
        staleTime: 10 * 60 * 1000,
    });
    const favoritesQueryKey = useMemo(() => ['perps', 'favorites', profileId] as const, [profileId]);
    const favoritesQuery = useQuery({
        queryKey: favoritesQueryKey,
        queryFn: () => getPerpsFavorites(200),
        enabled: Boolean(profileId),
        staleTime: 5 * 60 * 1000,
    });

    const categories = useMemo(
        () => [
            { label: t`Favorites`, value: 'favorites' },
            ...(categoriesQuery.data?.length
                ? categoriesQuery.data.map(({ display_name, name }) => ({ label: display_name, value: name }))
                : [{ label: t`All`, value: 'all' }]),
        ],
        [categoriesQuery.data],
    );

    const tokenCategories = useMemo(() => {
        const result = new Map<string, string[]>();
        for (const token of tokensQuery.data ?? []) {
            const name = token.name.toLowerCase();
            result.set(name, [...(result.get(name) ?? []), token.category_name]);
        }

        return result;
    }, [tokensQuery.data]);

    useEffect(() => {
        if (categories.some(({ value }) => value === category)) return;
        setCategory(categories[1]?.value ?? categories[0].value);
    }, [categories, category]);

    const favorites = useMemo(
        () => new Map((favoritesQuery.data ?? []).map(({ name }, index) => [name.toLowerCase(), index + 1])),
        [favoritesQuery.data],
    );
    const favoriteMutation = useMutation({
        mutationFn: async ({ name, favorite }: { name: string; favorite: boolean }) => {
            if (favorite) return removePerpsFavorite(name);
            return createPerpsFavorite(name);
        },
        onMutate: async ({ name, favorite }) => {
            await queryClient.cancelQueries({ queryKey: favoritesQueryKey });
            const previous = queryClient.getQueryData<PerpsFavorite[]>(favoritesQueryKey);
            queryClient.setQueryData<PerpsFavorite[]>(favoritesQueryKey, (current = []) =>
                favorite
                    ? current.filter((item) => item.name.toLowerCase() !== name.toLowerCase())
                    : [...current, { name }],
            );
            return { previous };
        },
        onError: (error, { favorite }, context) => {
            queryClient.setQueryData(favoritesQueryKey, context?.previous);
            enqueueMessageFromError(error, favorite ? t`Failed to remove favorite` : t`Failed to add favorite`);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: favoritesQueryKey }),
    });
    const toggleFavorite = useCallback(
        (coin: string) => {
            if (!profileId) {
                openLoginModalWithGuard();
                return;
            }
            const name = toRawPerpsMarketName(coin);
            favoriteMutation.mutate({ name, favorite: favorites.has(name.toLowerCase()) });
        },
        [favoriteMutation, favorites, profileId],
    );

    const orderedMarkets = useMemo(
        () =>
            filterAndOrderPerpsMarkets(
                markets.map((market) => ({
                    ...market,
                    favorite: favorites.has(toRawPerpsMarketName(market.coin).toLowerCase()),
                    favoritedAt: favorites.get(toRawPerpsMarketName(market.coin).toLowerCase()),
                    categories: tokenCategories.get(toRawPerpsMarketName(market.coin).toLowerCase()),
                })),
                query,
                category,
            ),
        [category, favorites, markets, query, tokenCategories],
    );

    return (
        <Popover className="relative">
            {({ open, close }) => (
                <>
                    <div className="flex items-center gap-1">
                        <PerpsFavoriteButton
                            favorite={favorites.has(toRawPerpsMarketName(selectedCoin).toLowerCase())}
                            label={
                                favorites.has(toRawPerpsMarketName(selectedCoin).toLowerCase())
                                    ? t`Remove ${selectedMarketDisplayName} favorite`
                                    : t`Add ${selectedMarketDisplayName} favorite`
                            }
                            className="size-5"
                            disabled={favoriteMutation.isPending}
                            onClick={() => toggleFavorite(selectedCoin)}
                        />
                        <PopoverButton
                            aria-label={t`Select market`}
                            className="flex h-[41px] items-center gap-1 text-left outline-none hover:opacity-80 focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#4c4aa9]"
                        >
                            <span
                                data-testid="perps-selected-market"
                                className="font-[Poppins] text-2xl font-semibold leading-9 text-lightTextMain"
                            >
                                {selectedMarketDisplayName}
                            </span>
                            <span className="rounded-full bg-[#efeff3] px-1.5 py-0.5 text-xs font-medium leading-[14px] text-[#a9a6bc]">
                                {leverage ?? '--'}
                            </span>
                            <ArrowDownIcon
                                className={classNames('size-4 text-lightTextMain transition-transform', {
                                    'rotate-180': open,
                                })}
                            />
                        </PopoverButton>
                    </div>

                    <PopoverPanel
                        transition
                        anchor="bottom start"
                        className="z-50 mt-1 w-[min(978px,calc(100vw-32px))] origin-top-left overflow-hidden rounded-2xl border border-[#e7e7e7] bg-white p-6 text-lightTextMain shadow-[0_16px_20px_rgba(64,61,87,0.1)] transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                    >
                        <label className="flex h-8 items-center gap-1.5 rounded-xl bg-[#efeff3] px-3 text-[#767676] focus-within:ring-1 focus-within:ring-[#4c4aa9]">
                            <SearchIcon className="size-4 shrink-0" />
                            <input
                                type="search"
                                aria-label={t`Search markets`}
                                value={query}
                                placeholder={t`Search`}
                                className="min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-sm leading-[18px] text-lightTextMain outline-none placeholder:text-[#767676] focus:border-0 focus:ring-0"
                                onChange={(event) => setQuery(event.target.value)}
                            />
                        </label>

                        <div
                            className="mt-3 flex h-12 items-stretch gap-5 border-b border-[#f5f5f5]"
                            role="tablist"
                            aria-label={t`Market categories`}
                        >
                            {categories.map(({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    role="tab"
                                    aria-selected={category === value}
                                    className={classNames(
                                        'relative px-1 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#4c4aa9]',
                                        category === value ? 'text-[#4c4aa9]' : 'text-[#767676]',
                                    )}
                                    onClick={() => setCategory(value)}
                                >
                                    {label}
                                    {category === value ? (
                                        <span className="absolute inset-x-0 bottom-0 h-1 rounded-full bg-[#4c4aa9]" />
                                    ) : null}
                                </button>
                            ))}
                        </div>

                        <div className="no-scrollbar overflow-x-auto">
                            <div className="min-w-[820px]">
                                <div className="grid h-[38px] grid-cols-[256px_80px_150px_96px_128px_128px] items-center gap-2 px-3 text-xs font-medium leading-[14px] text-[#767676]">
                                    <span>
                                        <Trans>Market</Trans>
                                    </span>
                                    <span>
                                        <Trans>Last Price</Trans>
                                    </span>
                                    <span>
                                        <Trans>24h Change</Trans>
                                    </span>
                                    <span>
                                        <Trans>8h Funding</Trans>
                                    </span>
                                    <span>
                                        <Trans>Volume</Trans>
                                    </span>
                                    <span>
                                        <Trans>Open Interest</Trans>
                                    </span>
                                </div>

                                <div role="listbox" className="no-scrollbar max-h-[294px] overflow-y-auto pr-2">
                                    {orderedMarkets.length ? (
                                        orderedMarkets.map((market) => {
                                            const change = market.priceChangeRatio;
                                            const funding = Number(market.fundingRate);
                                            const coinDisplayName = toPerpsCoinDisplayName(market.coin);
                                            const marketDisplayName = toPerpsMarketDisplayName(market.coin);
                                            return (
                                                <div
                                                    key={market.coin}
                                                    role="option"
                                                    tabIndex={0}
                                                    aria-selected={market.coin === selectedCoin}
                                                    className="grid h-[42px] cursor-pointer grid-cols-[256px_80px_150px_96px_128px_128px] items-center gap-2 rounded-lg px-3 text-left text-sm font-medium leading-[18px] outline-none hover:bg-[#f5f5f9] focus-visible:ring-2 focus-visible:ring-[#4c4aa9]"
                                                    onClick={() => {
                                                        onSelect(market.coin);
                                                        setQuery('');
                                                        close();
                                                    }}
                                                    onKeyDown={(event) => {
                                                        if (event.target !== event.currentTarget) return;
                                                        if (event.key !== 'Enter' && event.key !== ' ') return;
                                                        event.preventDefault();
                                                        onSelect(market.coin);
                                                        setQuery('');
                                                        close();
                                                    }}
                                                >
                                                    <span className="flex min-w-0 items-center gap-1.5">
                                                        <PerpsFavoriteButton
                                                            favorite={market.favorite}
                                                            label={
                                                                market.favorite
                                                                    ? t`Remove ${marketDisplayName} favorite`
                                                                    : t`Add ${marketDisplayName} favorite`
                                                            }
                                                            className="size-[18px]"
                                                            disabled={favoriteMutation.isPending}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                toggleFavorite(market.coin);
                                                            }}
                                                        />
                                                        <TokenIcon
                                                            name={coinDisplayName}
                                                            icon={resolvePerpsMarketIconUrl(market.coin)}
                                                            size={18}
                                                            className="shrink-0"
                                                        />
                                                        <span className="truncate text-lightTextMain">
                                                            {coinDisplayName}
                                                        </span>
                                                        <span className="flex h-5 items-center rounded bg-[rgba(61,194,51,0.1)] px-1 text-xs font-medium leading-[14px] text-[#3dc233]">
                                                            {market.maxLeverage ? `${market.maxLeverage}x` : '--'}
                                                        </span>
                                                    </span>
                                                    <span className="tabular-nums text-lightTextMain">
                                                        {formatPrice(market.lastPrice)}
                                                    </span>
                                                    <span
                                                        className={classNames(
                                                            'tabular-nums',
                                                            change === undefined
                                                                ? 'text-[#767676]'
                                                                : change >= 0
                                                                  ? 'text-[#3dc233]'
                                                                  : 'text-[#ff564d]',
                                                        )}
                                                    >
                                                        {formatPercent(change)}
                                                    </span>
                                                    <span
                                                        className={classNames(
                                                            'tabular-nums',
                                                            !Number.isFinite(funding)
                                                                ? 'text-[#767676]'
                                                                : funding >= 0
                                                                  ? 'text-[#3dc233]'
                                                                  : 'text-[#ff564d]',
                                                        )}
                                                    >
                                                        {formatFunding(market.fundingRate)}
                                                    </span>
                                                    <span className="tabular-nums text-lightTextMain">
                                                        {formatUsd(market.volume)}
                                                    </span>
                                                    <span className="tabular-nums text-lightTextMain">
                                                        {formatUsd(market.openInterest)}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="flex h-28 items-center justify-center text-sm text-[#767676]">
                                            <Trans>No markets found</Trans>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </PopoverPanel>
                </>
            )}
        </Popover>
    );
});
