import LeftArrowIcon from '@dimensiondev/assets/left-arrow.svg';
import SearchIcon from '@dimensiondev/assets/search.svg';
import { NetworkType, Source } from '@dimensiondev/enums';
import type { ErrorPageProps } from '@dimensiondev/types';
import { createIndicator, createNextIndicator, createPageable } from '@dimensiondev/utils';
import {
    isValidAddressEthereum,
    isValidAddressSolana,
    isValidDomainEthereum,
    isZeroAddressEthereum,
} from '@dimensiondev/web3/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { type HistoryState, useLocation, useRouter } from '@tanstack/react-router';
import { compact } from 'lodash-es';
import * as React from 'react';
import { Suspense, useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useDebounceValue } from 'usehooks-ts';
import type { Address } from 'viem';

import { BaseNotFound } from '@/components/BaseNotFound.js';
import { ErrorBoundary } from '@/components/ErrorBoundary.js';
import { ListInPage } from '@/components/ListInPage.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { RecipientItem, type RecipientItemProps } from '@/components/SendTransactionModal/RecipientItem.js';
import { type FormValues, RoutePath } from '@/components/SendTransactionModal/types.js';
import { formatSearchIdentities } from '@/helpers/formatSearchIdentities.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { logger } from '@/lib/Logger.js';
import { fireflyWorkerEndpoint } from '@/providers/firefly/worker.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

function SearchRecipientQueryErrorFallback({ reset }: ErrorPageProps) {
    return (
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-3">
            <p className="text-secondary text-sm">
                <Trans>Failed to search. Please try again.</Trans>
            </p>
            <button className="bg-highlight rounded-lg px-4 py-2 text-sm font-semibold text-white" onClick={reset}>
                <Trans>Retry</Trans>
            </button>
        </div>
    );
}

function EnsLookupErrorFallback({ reset }: ErrorPageProps) {
    return (
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-3">
            <p className="text-secondary text-sm">
                <Trans>ENS lookup failed. Please try again.</Trans>
            </p>
            <button className="bg-highlight rounded-lg px-4 py-2 text-sm font-semibold text-white" onClick={reset}>
                <Trans>Retry</Trans>
            </button>
        </div>
    );
}

export function SearchRecipientView() {
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

function SearchRecipient({
    onClick,
    networkType,
    initialKeyword = '',
}: {
    onClick: (recipient: RecipientItemProps, debouncedKeyword: string) => void;
    networkType: NetworkType;
    initialKeyword?: string;
}) {
    const router = useRouter();
    const [keyword, setKeyword] = useState(initialKeyword);
    const [debouncedKeyword, setDebouncedKeyword] = useDebounceValue(keyword, 300);
    useEffect(() => {
        setDebouncedKeyword(keyword);
    }, [keyword, setDebouncedKeyword]);

    const isTyping = keyword !== debouncedKeyword;

    return (
        <div className="flex h-svh w-full flex-col pb-6 md:h-full">
            <div className="shrink-0 px-6">
                <div className="relative flex items-center justify-center py-6">
                    <button
                        className="text-main absolute left-0 top-6 cursor-pointer rounded p-1"
                        onClick={() => {
                            router.navigate({ to: RoutePath.Form, replace: true });
                        }}
                    >
                        <LeftArrowIcon className="size-6" />
                    </button>
                    <h2 className="text-main text-lg font-semibold">
                        <Trans>Recipient</Trans>
                    </h2>
                </div>
                <div className="pb-2">
                    <div className="bg-lightBg focus-within:border-highlight flex w-full items-center rounded-lg border border-transparent px-3 transition-all">
                        <SearchIcon width={18} height={18} className="text-second mr-2 shrink-0" />
                        <input
                            autoFocus
                            className="text-main placeholder:text-secondary h-10 w-full border-0 bg-transparent px-0 py-2 focus:border-0 focus:outline-0 focus:ring-0 sm:text-sm sm:leading-6"
                            autoComplete="off"
                            placeholder={t`Address, ENS, or social handle`}
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 px-6">
                {isTyping ? (
                    <div className="flex w-full flex-1 items-center justify-center">
                        <LoadingIcon />
                    </div>
                ) : debouncedKeyword ? (
                    <ErrorBoundary key={debouncedKeyword} fallback={SearchRecipientQueryErrorFallback}>
                        <Suspense
                            fallback={
                                <div className="flex w-full flex-1 items-center justify-center">
                                    <LoadingIcon />
                                </div>
                            }
                        >
                            <RecipientList keyword={debouncedKeyword} networkType={networkType} onClick={onClick} />
                        </Suspense>
                    </ErrorBoundary>
                ) : null}
            </div>
        </div>
    );
}

function RecipientList({
    keyword,
    networkType,
    onClick,
}: {
    keyword: string;
    networkType: NetworkType;
    onClick: (recipient: RecipientItemProps, keyword: string) => void;
}) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['search-recipient', keyword],
        staleTime: 30_000,
        retry: 2,
        queryFn: async ({ pageParam, signal }) => {
            const indicator = pageParam ? createIndicator(undefined, pageParam) : undefined;
            const searchResponse = await getFireflyEndpoint().searchIdentity(keyword, {
                size: 20,
                cursor: indicator?.id,
                signal,
            });
            return createPageable(
                formatSearchIdentities(searchResponse.list || [], networkType, keyword),
                indicator,
                searchResponse.cursor && searchResponse.list?.length
                    ? createNextIndicator(indicator, `${searchResponse.cursor}`)
                    : undefined,
            );
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;
            return lastPage?.nextIndicator?.id;
        },
        select(data) {
            return compact(data.pages.flatMap((page) => page?.data));
        },
    });

    const recipients = queryResult.data ?? [];

    const renderRecipientItem = React.useCallback(
        (_: number, recipient: RecipientItemProps) => (
            <div
                role="button"
                tabIndex={0}
                className="hover:bg-bg w-full cursor-pointer rounded-lg px-3 py-2"
                onClick={() => onClick(recipient, keyword)}
            >
                <RecipientItem {...recipient} explorerLink showSources />
            </div>
        ),
        [onClick, keyword],
    );

    // Handle ENS lookup when no results found
    if (recipients.length === 0 && networkType === NetworkType.Ethereum && isValidDomainEthereum(keyword)) {
        return (
            <ErrorBoundary key={keyword} fallback={EnsLookupErrorFallback}>
                <Suspense
                    fallback={
                        <div className="flex w-full flex-1 items-center justify-center">
                            <LoadingIcon />
                        </div>
                    }
                >
                    <ENSLookupResult keyword={keyword} onClick={onClick} />
                </Suspense>
            </ErrorBoundary>
        );
    }

    if (recipients.length === 0) {
        const isDirectAddress =
            (networkType === NetworkType.Ethereum && isValidAddressEthereum(keyword)) ||
            (networkType === NetworkType.Solana && isValidAddressSolana(keyword));

        if (isDirectAddress) {
            const directRecipient: RecipientItemProps = {
                address: keyword as Address,
            };
            return (
                <div
                    role="button"
                    tabIndex={0}
                    className="hover:bg-bg w-full cursor-pointer rounded-lg px-3 py-2"
                    onClick={() => onClick(directRecipient, keyword)}
                >
                    <RecipientItem {...directRecipient} explorerLink />
                </div>
            );
        }

        return (
            <BaseNotFound className="!border-0">
                <div className="mt-11 text-sm font-bold">
                    <Trans>The address could not be found.</Trans>
                </div>
            </BaseNotFound>
        );
    }

    return (
        <ListInPage<RecipientItemProps>
            queryResult={queryResult}
            noResultsFallbackRequired={false}
            className="no-scrollbar mt-2"
            VirtualListProps={{
                useWindowScroll: false,
                style: { height: '100%' },
                computeItemKey: (index, item) => `${item.address}-${item.handle}-${index}`,
                itemContent: renderRecipientItem,
            }}
        />
    );
}

function ENSLookupResult({
    keyword,
    onClick,
}: {
    keyword: string;
    onClick: (recipient: RecipientItemProps, keyword: string) => void;
}) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['ens-lookup', keyword],
        staleTime: 60_000,
        retry: 2,
        queryFn: async ({ signal }) => {
            try {
                const address = await fireflyWorkerEndpoint.lookup(keyword, { signal });
                if (address) {
                    return createPageable<RecipientItemProps>(
                        [
                            {
                                address,
                                avatar: getStampAvatarByProfileId(Source.Wallet, keyword),
                                ens: keyword,
                            },
                        ],
                        createIndicator(),
                    );
                }
                return createPageable<RecipientItemProps>([], createIndicator());
            } catch (error) {
                logger.error('ENS lookup failed', { keyword, error });
                return createPageable<RecipientItemProps>([], createIndicator());
            }
        },
        initialPageParam: '',
        getNextPageParam: () => undefined,
        select(data) {
            return compact(data.pages.flatMap((page) => page?.data));
        },
    });

    const recipients = queryResult.data ?? [];

    const renderRecipientItem = React.useCallback(
        (_: number, recipient: RecipientItemProps) => (
            <div
                role="button"
                tabIndex={0}
                className="hover:bg-bg w-full cursor-pointer rounded-lg px-3 py-2"
                onClick={() => onClick(recipient, keyword)}
            >
                <RecipientItem {...recipient} explorerLink showSources />
            </div>
        ),
        [onClick, keyword],
    );

    if (recipients.length === 0) {
        return (
            <BaseNotFound className="!border-0">
                <div className="mt-11 text-sm font-bold">
                    <Trans>The address could not be found.</Trans>
                </div>
            </BaseNotFound>
        );
    }

    return (
        <ListInPage<RecipientItemProps>
            queryResult={queryResult}
            noResultsFallbackRequired={false}
            className="no-scrollbar mt-2"
            VirtualListProps={{
                useWindowScroll: false,
                style: { height: '100%' },
                computeItemKey: (index, item) => `${item.address}-${index}`,
                itemContent: renderRecipientItem,
            }}
        />
    );
}
