import { useInfiniteQuery } from '@tanstack/react-query';
import { compact, uniq, uniqBy } from 'lodash-es';
import { useEffect, useState } from 'react';

import type { RecipientItemProps } from '@/components/SendTransactionModal/RecipientItem.js';
import {
    SelectRecipientModal,
    type SelectRecipientModalProps,
} from '@/components/SendTransactionModal/SelectRecipientModal.js';
import { FireflyPlatform, NetworkType, SearchType } from '@/constants/enum.js';
import {
    composeSearchProfiles,
    formatSearchProfile,
    type SearchProfile,
    sortSearchProfiles,
} from '@/helpers/formatSearchProfile.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { toFireflyPlatformId } from '@/helpers/isSameProfile.js';
import { isValidAddress, isZeroAddress } from '@/helpers/isValidAddress.js';
import { isValidDomainEthereum } from '@/helpers/isValidDomain.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { resolveSocialSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { TwitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';
import { searchWalletAddress } from '@/services/searchWalletAddress.js';

const noNextPage = '__no_next_page__';
const searchType = SearchType.Profiles;

export interface SelectRecipientModalWithQueryProps
    extends Pick<SelectRecipientModalProps, 'open' | 'onSelect' | 'onClose'> {
    keyword?: string;
    networkType?: NetworkType;
}

export function SelectRecipientModalWithQuery({
    keyword = '',
    networkType,
    ...props
}: SelectRecipientModalWithQueryProps) {
    const [searchKeyword, setSearchKeyword] = useState('');
    useEffect(() => {
        if (props.open && keyword) {
            setSearchKeyword(keyword);
        }
    }, [keyword, props.open]);

    const queryResult = useInfiniteQuery({
        queryKey: ['search', searchType, searchKeyword, 'recipient'],
        queryFn: async ({ pageParam }) => {
            if (!searchKeyword) return;

            const fireflyIndicator = pageParam.firefly ? createIndicator(undefined, pageParam.firefly) : undefined;
            const twitterIndicator = pageParam.twitter ? createIndicator(undefined, pageParam.twitter) : undefined;
            const bskyIndicator = pageParam.bsky ? createIndicator(undefined, pageParam.bsky) : undefined;

            const data =
                pageParam.firefly !== noNextPage
                    ? await FireflyEndpointProvider.searchIdentity(searchKeyword, {
                          size: 20,
                          indicator: fireflyIndicator,
                      })
                    : createPageable([], createIndicator());

            const trimmed = searchKeyword.trim().replace(/^@/, '');
            const twitterProfiles =
                pageParam.twitter !== noNextPage && trimmed
                    ? await runInSafeAsync(() => TwitterSocialMediaProxy.searchProfiles(trimmed, twitterIndicator, 7))
                    : undefined;

            const bskyProfiles =
                pageParam.bsky !== noNextPage
                    ? await runInSafeAsync(() =>
                          BskySocialMediaProvider.searchProfiles(searchKeyword, bskyIndicator, 3),
                      )
                    : undefined;

            const socialProfiles = sortSearchProfiles(
                composeSearchProfiles(
                    compact(data.data.map((x) => formatSearchProfile(x, searchKeyword))),
                    twitterProfiles?.data || [],
                    bskyProfiles?.data || [],
                ),
                searchKeyword,
            );

            const isFirstPage = !pageParam.firefly && !pageParam.twitter && !pageParam.bsky;
            const walletProfile =
                !socialProfiles.length && isFirstPage ? await searchWalletAddress(searchKeyword) : undefined;

            return {
                ...data,
                __original__: data.data,
                twitterNextIndicator: twitterProfiles?.nextIndicator,
                bskyNextIndicator: bskyProfiles?.nextIndicator,
                data: socialProfiles.length
                    ? socialProfiles
                    : walletProfile
                      ? [
                            {
                                profile: walletProfile,
                                related: [walletProfile],
                                addresses: [
                                    {
                                        address: walletProfile.platform_id,
                                        ...(isValidDomainEthereum(walletProfile.name)
                                            ? { name: walletProfile.name }
                                            : {}),
                                    },
                                ],
                            },
                        ]
                      : [],
            };
        },
        initialPageParam: { firefly: '', twitter: '', bsky: '' },
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;

            const { nextIndicator, twitterNextIndicator, bskyNextIndicator } = lastPage || {};
            if (!nextIndicator && !twitterNextIndicator && !bskyNextIndicator) return;

            return {
                firefly: nextIndicator?.id || noNextPage,
                twitter: twitterNextIndicator?.id || noNextPage,
                bsky: bskyNextIndicator?.id || noNextPage,
            };
        },
        select(data) {
            return uniqBy(compact(data.pages.flatMap((x) => x?.data ?? [])), ({ profile }) =>
                toFireflyPlatformId(profile),
            )
                .filter(
                    (x) =>
                        x.addresses?.length &&
                        x.addresses?.[0].address &&
                        isValidAddress(x.addresses?.[0].address) &&
                        !isZeroAddress(x.addresses?.[0].address),
                )
                .map((x) => {
                    if (x.profile.platform === FireflyPlatform.Wallet) {
                        const ens =
                            !isValidAddress(x.profile.name) && isValidDomainEthereum(x.profile.name)
                                ? x.profile.name
                                : undefined;
                        const address = x.profile.platform_id;
                        return formatRecipient({ ...x, address, ens, fireflyId: x.account?.platform_id });
                    }
                    const recipients =
                        x.addresses
                            ?.filter(({ address }) => (networkType ? getAddressType(address) === networkType : true))
                            .map(({ address, ens }) => formatRecipient({ ...x, address, ens })) ?? [];
                    return recipients.length === 1 ? recipients[0] : recipients;
                })
                .filter((x) => (Array.isArray(x) ? x.length : getAddressType(x.address) === networkType));
        },
        enabled: props.open,
    });

    return (
        <SelectRecipientModal
            {...props}
            initialKeyword={keyword}
            onQuery={setSearchKeyword}
            isLoading={queryResult.isLoading}
            recipients={queryResult.data}
        />
    );
}

function formatRecipient({
    profile,
    related,
    address,
    ens,
    fireflyId,
}: Pick<SearchProfile, 'profile' | 'related'> & {
    address: string;
    ens?: string;
    fireflyId?: string;
}): RecipientItemProps {
    if (profile.platform === FireflyPlatform.Wallet) {
        return {
            address,
            ens,
        };
    }
    const source = resolveSocialSourceFromFireflyPlatform(profile.platform);
    return {
        address,
        ens,
        avatar: getStampAvatarByProfileId(source, profile.platform_id || address),
        username: profile.name,
        handle: profile.handle,
        source,
        sources: uniq(related.map((r) => resolveSocialSourceFromFireflyPlatform(r.platform))),
        fireflyId,
    } satisfies RecipientItemProps;
}
