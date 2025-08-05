import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useInfiniteQuery } from '@tanstack/react-query';
import { compact, first, uniq } from 'lodash-es';
import { useEffect, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';

import SearchIcon from '@/assets/search.svg';
import { BaseNotFound } from '@/components/BaseNotFound.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { RecipientItem, type RecipientItemProps } from '@/components/SendTransactionModal/RecipientItem.js';
import { NetworkType } from '@/constants/enum.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isValidAddress } from '@/helpers/isValidAddress.js';
import { ETH_ZERO_ADDRESS } from '@/helpers/isZeroAddress.js';
import { createIndicator } from '@/helpers/pageable.js';
import { resolveSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function SearchRecipient({
    onClick,
    networkType,
    initialKeyword = '',
}: {
    onClick: (recipient: RecipientItemProps, debouncedKeyword: string) => void;
    networkType: NetworkType;
    initialKeyword?: string;
}) {
    const [keyword, setKeyword] = useState(initialKeyword);
    const [debouncedKeyword, setDebouncedKeyword] = useDebounceValue(keyword, 300);
    useEffect(() => {
        setDebouncedKeyword(keyword);
    }, [keyword, setDebouncedKeyword]);
    const queryResult = useInfiniteQuery({
        queryKey: ['search-recipient', debouncedKeyword],
        queryFn: async ({ pageParam }) => {
            if (!debouncedKeyword) return;
            const fireflyIndicator = pageParam ? createIndicator(undefined, pageParam) : undefined;
            return FireflyEndpointProvider.searchIdentity(debouncedKeyword, {
                size: 20,
                indicator: fireflyIndicator,
            });
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;
            return lastPage?.nextIndicator?.id;
        },
        select(data) {
            return data.pages.flatMap((page) => {
                if (!page) {
                    if (isValidAddress(debouncedKeyword)) {
                        return {
                            address: debouncedKeyword,
                        };
                    }
                }
                return compact(
                    page?.data
                        .filter((item) => {
                            switch (networkType) {
                                case NetworkType.Ethereum:
                                    return (item.eth?.length ?? 0) > 0;
                                case NetworkType.Solana:
                                    return (item.solana?.length ?? 0) > 0;
                                default:
                                    return false;
                            }
                        })
                        .map((item) => {
                            const profiles = compact(
                                SORTED_SOCIAL_SOURCES.map((source) => first(item[resolveSocialSourceInUrl(source)])),
                            );
                            const profile = first(profiles);
                            if (!profile) return null;
                            const source = resolveSourceFromFireflyPlatform(profile.platform);
                            return {
                                address: ETH_ZERO_ADDRESS,
                                avatar:
                                    profile.avatar ||
                                    getStampAvatarByProfileId(
                                        resolveSourceFromFireflyPlatform(profile.platform),
                                        profile.platform_id,
                                    ),
                                username: profile.name,
                                handle: profile.handle,
                                source,
                                id: profile.platform_id,
                                sources: uniq(
                                    profiles.map((profile) => resolveSourceFromFireflyPlatform(profile.platform)),
                                ),
                                fireflyId: first(item.account)?.platform_id,
                            } as RecipientItemProps;
                        }),
                );
            });
        },
    });
    const recipients = queryResult.data ?? [];

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex w-full items-center rounded-lg border border-transparent bg-lightBg px-3 transition-all focus-within:border-highlight">
                <SearchIcon width={18} height={18} className="mr-2 shrink-0 text-second" />
                <input
                    className="h-10 w-full border-0 bg-transparent px-0 py-2 placeholder-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm sm:leading-6"
                    placeholder={t`Address, ENS, or social handle`}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />
            </div>
            {queryResult.isLoading && !recipients?.length ? (
                <div className="flex w-full flex-1 items-center justify-center">
                    <LoadingIcon />
                </div>
            ) : recipients?.length ? (
                <div className="mt-2 flex w-full flex-1 flex-col space-y-2 overflow-y-auto">
                    {recipients?.map((recipient, i) => {
                        return (
                            <div
                                role="button"
                                tabIndex={0}
                                key={i}
                                className="w-full cursor-pointer rounded-lg px-3 py-2 hover:bg-bg"
                                onClick={() => onClick(recipient, debouncedKeyword)}
                            >
                                <RecipientItem {...recipient} explorerLink showSources />
                            </div>
                        );
                    })}
                </div>
            ) : keyword ? (
                <BaseNotFound className="!border-0">
                    <div className="mt-11 text-sm font-bold">
                        <Trans>The address could not be found.</Trans>
                    </div>
                </BaseNotFound>
            ) : null}
        </div>
    );
}
