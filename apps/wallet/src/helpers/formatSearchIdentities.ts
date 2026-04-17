import { safeUnreachable } from '@dimensiondev/utils';
import { ETH_ZERO_ADDRESS } from '@dimensiondev/web3/constants';
import { isValidAddress, isValidAddressEthereum, isValidAddressSolana, isZeroAddress } from '@dimensiondev/web3/utils';
import { compact, first, uniq } from 'lodash-es';
import type { Address } from 'viem';

import type { RecipientItemProps } from '@/components/SendTransactionModal/RecipientItem.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/computed.js';
import { NetworkType, type SocialSource, Source } from '@/constants/enum.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { resolveSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import type { Profile as FireflyProfile, SearchProfileListItem } from '@/providers/types/Firefly.js';

function isAddressContained(item: SearchProfileListItem, networkType: NetworkType) {
    switch (networkType) {
        case NetworkType.Solana:
            return [item.solana, item.sns, item.skr].some((list) => (list?.length || 0) > 0);
        case NetworkType.Ethereum:
            return [item.eth, item.ens, item['base.eth']].some((list) => (list?.length || 0) > 0);
        default:
            safeUnreachable(networkType);
            return false;
    }
}

function resolveAddress(profile: FireflyProfile) {
    const keys = ['resolved_address', 'registrant', 'owner', 'wrapped_owner', 'owner_address'] as const;

    for (const key of keys) {
        const address = profile[key];
        if (typeof address === 'string' && isValidAddress(address) && !isZeroAddress(address)) return address;
    }

    return null;
}

function getEnsMatchedResult(
    item: SearchProfileListItem,
    networkType: NetworkType,
    keyword: string,
): RecipientItemProps | null {
    switch (networkType) {
        case NetworkType.Ethereum: {
            const ens = [...(item.ens || []), ...(item['base.eth'] || [])].find(
                (x) => x.hit || resolveAddress(x)?.toLowerCase() === keyword?.toLowerCase(),
            );
            if (!ens) return null;

            const resolvedAddress = resolveAddress(ens);
            if (resolvedAddress && isValidAddressEthereum(resolvedAddress)) {
                return {
                    address: resolvedAddress as Address,
                    ens: ens.handle,
                    avatar: getStampAvatarByProfileId(Source.Wallet, ens.handle),
                    fireflyId: first(item.account)?.platform_id,
                } satisfies RecipientItemProps;
            }

            return null;
        }
        case NetworkType.Solana: {
            const ensMatched = [...(item.sns || []), ...(item.skr || [])].find(
                (x) => x.hit || resolveAddress(x)?.toLowerCase() === keyword?.toLowerCase(),
            );
            if (!ensMatched) return null;

            const resolvedAddress = resolveAddress(ensMatched);
            if (resolvedAddress && isValidAddressSolana(resolvedAddress)) {
                return {
                    address: resolvedAddress as Address,
                    ens: ensMatched.handle,
                    avatar: getStampAvatarByProfileId(Source.Wallet, resolvedAddress),
                    fireflyId: first(item.account)?.platform_id,
                } satisfies RecipientItemProps;
            }

            return null;
        }
        default:
            safeUnreachable(networkType);
            return null;
    }
}

export function formatSearchIdentities(identities: SearchProfileListItem[], networkType: NetworkType, keyword: string) {
    const filteredList = compact(
        identities
            .filter((item) => isAddressContained(item, networkType))
            .map((item) => {
                const ensMatchedResult = getEnsMatchedResult(item, networkType, keyword);
                if (ensMatchedResult) return ensMatchedResult;

                const profiles = compact(
                    SORTED_SOCIAL_SOURCES.map((source) => {
                        return first(
                            item[resolveSocialSourceInUrl(source)]?.sort((a, b) => {
                                const aMatch = a.handle === keyword || a.hit || a.special ? 1 : 0;
                                const bMatch = b.handle === keyword || b.hit || b.special ? 1 : 0;
                                return bMatch - aMatch;
                            }),
                        );
                    }),
                );
                const profile = first(profiles);
                if (!profile) return null;
                const source = resolveSourceFromFireflyPlatform(profile.platform) as SocialSource;
                const sources = uniq(
                    profiles.map((profile) => resolveSourceFromFireflyPlatform(profile.platform)),
                ) as SocialSource[];
                return {
                    address: ETH_ZERO_ADDRESS,
                    avatar:
                        profile.avatar || profile.platform_id
                            ? getStampAvatarByProfileId(
                                  resolveSourceFromFireflyPlatform(profile.platform),
                                  profile.platform_id,
                              )
                            : undefined,
                    username: profile.name,
                    handle: profile.handle,
                    source,
                    id: profile.platform_id,
                    sources,
                    fireflyId: first(item.account)?.platform_id,
                } satisfies RecipientItemProps;
            }),
    );
    const deduplicatedData = (() => {
        const seen = new Map<string, number>();
        const result: RecipientItemProps[] = [];
        for (const item of filteredList) {
            if (!item.fireflyId) {
                result.push(item);
                continue;
            }
            const existingIndex = seen.get(item.fireflyId);
            if (existingIndex === undefined) {
                seen.set(item.fireflyId, result.length);
                result.push(item);
            } else {
                const existing = result[existingIndex];
                if (item.source && !existing.source) {
                    result[existingIndex] = { ...item, ens: existing.ens || item.ens };
                } else if (item.ens && !existing.ens) {
                    result[existingIndex] = { ...existing, ens: item.ens };
                }
            }
        }

        return result;
    })();

    return deduplicatedData;
}
