'use client';

import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { useQueries } from '@tanstack/react-query';
import { first, nth, sortBy } from 'lodash-es';
import { type HTMLProps, memo, useCallback, useMemo, useState } from 'react';

import { ClickableArea } from '@/components/ClickableArea.js';
import { AddressCard, AddressCardIndicator } from '@/components/EmbedCards/AddressCard.js';
import { DomainCard, DomainCardIndicator } from '@/components/EmbedCards/DomainCard.js';
import { extractEmbedResources, isAvailableAddress } from '@/components/EmbedCards/helpers.js';
import { EmbedLinkCard, LinkCardIndicator } from '@/components/EmbedCards/LinkCard.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { resolveOembedUrl } from '@/helpers/resolveOembedUrl.js';
import { useClassifyPostLinks } from '@/hooks/useClassifyPostLink.js';
import { useResolveEnsDomains } from '@/hooks/useResolveEnsDomains.js';
import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface EmbedEntry {
    type: 'address' | 'domain' | 'url';
    value: string;
}

interface EmbedCardsInnerProps extends HTMLProps<HTMLDivElement> {
    post: Post;
    embeds: EmbedEntry[];
}

const EmbedCardsInner = memo<EmbedCardsInnerProps>(function EmbedCardsInner({ embeds, post, ...rest }) {
    const addresses = embeds.filter((x) => x.type === 'address');
    const addressQueries = useQueries({
        queries: addresses.map(({ value: address }) => ({
            queryKey: ['detect-address', address],
            queryFn: () => fireflyWalletProvider.detectAddress(address),
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
                return <AddressCard key={embed.value} className="rounded-2xl !bg-lightBg" address={embed.value} />;
            case 'domain':
                return <DomainCard key={embed.value} className="rounded-2xl bg-lightBg" domain={embed.value} />;
            case 'url':
                return <EmbedLinkCard key={embed.value} className="!bg-lightBg" link={embed.value} />;
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
                                return (
                                    <LinkCardIndicator
                                        key={item.value}
                                        link={item.value}
                                        active={active}
                                        onClick={handleClick}
                                        onAvailableUpdate={handleAvailableUpdate}
                                    />
                                );
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
    const content = post.metadata.content?.content;
    const oembedUrl = resolveOembedUrl(post);

    // Extract links, addresses and domains
    const { addresses, ignoredLinks, links, domains } = useMemo(
        () => extractEmbedResources(content, oembedUrl),
        [oembedUrl, content],
    );

    const { data: classifyResults = [] } = useClassifyPostLinks(links);
    const domainResolveResults = useResolveEnsDomains(domains);

    // Merge links, addresses and domains
    const embeds = useMemo(() => {
        if (!content) return EMPTY_LIST;

        const availableLinks = links.filter((_, i) => {
            const result = nth(classifyResults, i);
            if (!result) return false;
            return !!(result.result.nft || result.result.collection);
        });
        const lowerIgnoredLinks = ignoredLinks.map((x) => x.toLowerCase());
        const availableDomains = domains.filter((domain, i) => {
            const result = domainResolveResults[i];
            if (!result.data) return result.data;
            const ignored = ignoredLinks.some((link) => link.includes(domain.toLowerCase()));
            return !ignored;
        });

        const lowerDomains = availableDomains.map((x) => x.toLowerCase());
        const embeds = [
            ...addresses
                .filter((x) => !links.some((link) => link.toLowerCase().includes(x.toLowerCase()))) // exclude addresses that are already in links
                .filter((x) => !lowerDomains.some((domain) => domain.includes(x.toLowerCase()))) // exclude addresses that are already in domains
                .filter((address) => !lowerIgnoredLinks.some((link) => link.includes(address.toLowerCase())))
                .map((address) => ({ type: 'address', value: address })),
            ...availableLinks.map((link) => ({ type: 'url', value: link })),
            ...availableDomains
                .filter((domain) => !links.some((link) => link.includes(domain))) // exclude domains in links
                .map((domain) => ({ type: 'domain', value: domain })),
        ] as EmbedEntry[];

        const lowercasePostContent = content.toLowerCase();
        return sortBy(embeds, (x) => lowercasePostContent.indexOf(x.value.toLowerCase()));
    }, [addresses, classifyResults, ignoredLinks, domainResolveResults, domains, links, content]);

    if (!embeds.length) return null;

    return <EmbedCardsInner post={post} embeds={embeds} {...rest} />;
});
