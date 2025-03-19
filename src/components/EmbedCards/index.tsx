'use client';

import { safeUnreachable } from '@masknet/kit';
import { useQueries } from '@tanstack/react-query';
import { compact, first, groupBy, sortBy, uniqBy } from 'lodash-es';
import { type HTMLProps, memo, useCallback, useMemo, useState } from 'react';

import { ClickableArea } from '@/components/ClickableArea.js';
import { AddressCard, AddressCardIndicator } from '@/components/EmbedCards/AddressCard.js';
import { DomainCard, DomainCardIndicator } from '@/components/EmbedCards/DomainCard.js';
import { isAvailableAddress, isFarcasterPost, isTakoPost } from '@/components/EmbedCards/helpers.js';
import { Indicator } from '@/components/EmbedCards/Indicator.js';
import { EmbedLinkCard } from '@/components/EmbedCards/LinkCard.js';
import { EMPTY_LIST } from '@/constants/index.js';
import {
    ENS_REGEXP,
    EXIST_EVM_ADDRESS,
    EXIST_SOLANA_ADDRESS,
    FULL_ENS_REGEXP,
    LENS_HANDLE_REGEXP,
    URL_REGEX,
} from '@/constants/regexp.js';
import { classNames } from '@/helpers/classNames.js';
import { resolveOembedUrl } from '@/helpers/resolveOembedUrl.js';
import { useClassifyPostLinks } from '@/hooks/useClassifyPostLink.js';
import { useResolveEnsDomains } from '@/hooks/useResolveEnsDomains.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface EmbedEntry {
    type: 'address' | 'domain' | 'url';
    value: string;
}

interface EmbedCardsInnerProps extends HTMLProps<HTMLDivElement> {
    post: Post;
    embeds: EmbedEntry[];
}
export const EmbedCardsInner = memo<EmbedCardsInnerProps>(function EmbedCardsInner({ embeds, post, ...rest }) {
    const addresses = embeds.filter((x) => x.type === 'address');
    const addressQueries = useQueries({
        queries: addresses.map(({ value: address }) => ({
            queryKey: ['detect-address', address],
            queryFn: () => FireflyEndpointProvider.detectAddress(address),
        })),
        combine(result) {
            return result.map((query) => {
                const list = query.data?.list.filter(isAvailableAddress);
                return list || [];
            });
        },
    });

    const [unavailableEmbeds, setUnavailableEmbeds] = useState<string[]>([]);
    const handleAvailableUpdate = useCallback((data: string, available: boolean) => {
        if (available) {
            setUnavailableEmbeds((prev) => prev.filter((x) => x !== data));
        } else {
            setUnavailableEmbeds((prev) => [...prev, data]);
        }
    }, []);

    const availableEmbeds = embeds.filter((x) => {
        if (unavailableEmbeds.includes(x.value)) return false;
        switch (x.type) {
            case 'url':
            case 'domain':
                return true;
            case 'address':
                const addressQueryIndex = addresses.findIndex((y) => y.value === x.value);
                return first(addressQueries[addressQueryIndex]);
            default:
                safeUnreachable(x.type);
                return false;
        }
    });

    const [activeIndex, setActiveIndex] = useState(0);
    const hasAvailableItems = availableEmbeds.length > 0;
    if (!hasAvailableItems) return null;

    const embed = availableEmbeds[activeIndex];
    const renderCard = () => {
        switch (embed.type) {
            case 'address':
                return (
                    <AddressCard
                        key={embed.value}
                        className="min-h-[109px] rounded-2xl !bg-lightBg"
                        address={embed.value}
                    />
                );
            case 'domain':
                return (
                    <DomainCard
                        key={embed.value}
                        className="min-h-[109px] rounded-2xl bg-lightBg"
                        domain={embed.value}
                    />
                );
            case 'url':
                return <EmbedLinkCard key={embed.value} className="!bg-lightBg" link={embed.value} post={post} />;
            default:
                safeUnreachable(embed.type);
                return null;
        }
    };

    return (
        <div {...rest} className={classNames('mt-1 flex w-full flex-col gap-[6px]', rest.className)}>
            {renderCard()}
            {availableEmbeds.length > 1 ? (
                <ClickableArea className="flex justify-center gap-[6px] py-2">
                    {availableEmbeds.map((item, index) => {
                        const active = index === activeIndex;
                        const handleClick = () => setActiveIndex(index);
                        switch (item.type) {
                            case 'address':
                                return (
                                    <AddressCardIndicator
                                        key={item.value}
                                        address={item.value}
                                        active={active}
                                        onClick={handleClick}
                                        data={item.value}
                                        onAvailableUpdate={handleAvailableUpdate}
                                    />
                                );
                            case 'domain':
                                return (
                                    <DomainCardIndicator
                                        key={item.value}
                                        domain={item.value}
                                        active={active}
                                        onClick={handleClick}
                                        data={item.value}
                                        onAvailableUpdate={handleAvailableUpdate}
                                    />
                                );
                            case 'url':
                                return <Indicator key={item.value} active={active} onClick={handleClick} />;
                            default:
                                safeUnreachable(item.type);
                                return null;
                        }
                    })}
                </ClickableArea>
            ) : null}
        </div>
    );
});

interface EmbedCardsProps extends HTMLProps<HTMLDivElement> {
    post: Post;
}

export const EmbedCards = memo(function EmbedCards({ post, ...rest }: EmbedCardsProps) {
    const postRawContent = post.metadata.content?.content;
    const oembedUrl = resolveOembedUrl(post);

    // Extract links, addresses and domains
    const { addresses, ignoredLinks, links, domains } = useMemo(() => {
        if (!postRawContent)
            return { ignoredLinks: EMPTY_LIST, links: EMPTY_LIST, addresses: EMPTY_LIST, domains: EMPTY_LIST };
        const links = uniqBy(
            compact([...(postRawContent.match(URL_REGEX) || []).map((x) => x.trim()), oembedUrl]).filter(
                (x) => !FULL_ENS_REGEXP.test(x) && !LENS_HANDLE_REGEXP.test(x),
            ),
            (x) => x.toLowerCase(),
        );
        const { ignored: ignored = [], keep = [] } = groupBy(links, (link) => {
            return isFarcasterPost(link) || isTakoPost(link) ? 'ignored' : 'keep';
        });

        const evmAddresses = postRawContent.match(EXIST_EVM_ADDRESS) || [];
        const solanaAddresses = postRawContent.match(EXIST_SOLANA_ADDRESS) || [];
        const addresses = compact(
            uniqBy(
                [...evmAddresses, ...solanaAddresses].map((x) => x.trim()),
                (x) => x.toLowerCase(),
            ),
        );

        const domains = Array.from(postRawContent.match(ENS_REGEXP) || []);

        return { addresses, domains, ignoredLinks: ignored, links: keep };
    }, [oembedUrl, postRawContent]);

    const classifyResults = useClassifyPostLinks(links, post);
    const domainResolveResults = useResolveEnsDomains(domains);

    // Merge links, addresses and domains
    const embeds = useMemo(() => {
        if (!postRawContent) return EMPTY_LIST;

        const availableLinks = links.filter((_, i) => {
            const result = classifyResults[i];
            return result?.nft || result?.collection;
        });
        const availableDomains = domains.filter((_, i) => {
            const result = domainResolveResults[i];
            return result.data;
        });

        const lowerLinks = availableLinks.map((x) => x.toLowerCase());
        const lowerIgnoredLinks = ignoredLinks.map((x) => x.toLowerCase());
        const lowerDomains = availableDomains.map((x) => x.toLowerCase());
        const embeds = [
            ...addresses
                .filter((x) => !lowerLinks.some((link) => link.includes(x.toLowerCase()))) // exclude addresses that are already in links
                .filter((x) => !lowerDomains.some((domain) => domain.includes(x.toLowerCase()))) // exclude addresses that are already in domains
                .filter((address) => !lowerIgnoredLinks.some((link) => link.includes(address)))
                .map((address) => ({ type: 'address', value: address })),
            ...availableLinks.map((link) => ({ type: 'url', value: link })),
            ...availableDomains.map((domain) => ({ type: 'domain', value: domain })),
        ] as EmbedEntry[];

        const lowercasePostContent = postRawContent.toLowerCase();
        return sortBy(embeds, (x) => lowercasePostContent.indexOf(x.value.toLowerCase()));
    }, [addresses, classifyResults, ignoredLinks, domainResolveResults, domains, links, postRawContent]);

    if (!embeds.length) return null;

    return <EmbedCardsInner post={post} embeds={embeds} {...rest} />;
});
