'use client';

import 'swiper/css';

import { safeUnreachable } from '@masknet/kit';
import { useQueries } from '@tanstack/react-query';
import { compact, first, sortBy, uniqBy } from 'lodash-es';
import { type HTMLProps, memo, useMemo, useState } from 'react';

import { ClickableArea } from '@/components/ClickableArea.js';
import { AddressCard } from '@/components/EmbedCards/AddressCard.js';
import { isAvailableAddress } from '@/components/EmbedCards/helpers.js';
import { EmbedLinkCard } from '@/components/EmbedCards/LinkCard.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { EXIST_EVM_ADDRESS, EXIST_SOLANA_ADDRESS, URL_REGEX } from '@/constants/regexp.js';
import { classNames } from '@/helpers/classNames.js';
import { resolveOembedUrl } from '@/helpers/resolveOembedUrl.js';
import { useClassifyPostLinks } from '@/hooks/useClassifyPostLink.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface EmbedEntry {
    type: 'address' | 'url';
    value: string;
}

interface EmbedCardsInnerProps extends HTMLProps<HTMLDivElement> {
    post: Post;
    embeds: EmbedEntry[];
}
export const EmbedCardsInner = memo<EmbedCardsInnerProps>(function EmbedCardsInner({ embeds, post, ...rest }) {
    const [activeIndex, setActiveIndex] = useState(0);

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
    const availableEmbeds = embeds.filter((x) => {
        switch (x.type) {
            case 'url':
                return true;
            case 'address':
                const addressQueryIndex = addresses.findIndex((y) => y.value === x.value);
                return first(addressQueries[addressQueryIndex]);
            default:
                safeUnreachable(x.type);
                return false;
        }
    });

    const hasAvailableItems = availableEmbeds.length > 0;
    if (!hasAvailableItems) return null;

    const embed = availableEmbeds[activeIndex];
    const renderCard = () => {
        switch (embed.type) {
            case 'address':
                return <AddressCard className="h-[109px] rounded-2xl bg-bg" address={embed.value} />;
            case 'url':
                return <EmbedLinkCard link={embed.value} post={post} />;
            default:
                safeUnreachable(embed.type);
                return null;
        }
    };

    return (
        <div {...rest} className={classNames('flex w-full flex-col gap-[6p5]', rest.className)}>
            {renderCard()}
            {availableEmbeds.length > 1 ? (
                <ClickableArea className="flex justify-center gap-[6px] py-2">
                    {availableEmbeds.map((item, index) => {
                        return (
                            <div
                                key={item.value}
                                className="w-[60px] min-w-2 cursor-pointer py-2"
                                onClick={() => {
                                    setActiveIndex(index);
                                }}
                            >
                                <div
                                    className={classNames(
                                        'h-1 bg-highlight',
                                        activeIndex === index ? 'opacity-50' : '',
                                    )}
                                />
                            </div>
                        );
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

    const { addresses, links } = useMemo(() => {
        if (!postRawContent) return { links: EMPTY_LIST, addresses: EMPTY_LIST };
        const links = uniqBy(
            compact([...(postRawContent.match(URL_REGEX) || []).map((x) => x.trim()), oembedUrl]),
            (x) => x.toLowerCase(),
        );
        const evmAddresses = postRawContent.match(EXIST_EVM_ADDRESS) || [];
        const solanaAddresses = postRawContent.match(EXIST_SOLANA_ADDRESS) || [];
        const addresses = compact(
            uniqBy(
                [...evmAddresses, ...solanaAddresses].map((x) => x.trim()),
                (x) => x.toLowerCase(),
            ),
        );

        return { links, addresses };
    }, [oembedUrl, postRawContent]);

    const classifyResults = useClassifyPostLinks(links, post);
    const availableLinks = useMemo(() => {
        return links.filter((_, i) => {
            const result = classifyResults[i];
            return result?.nft || result?.collection;
        });
    }, [classifyResults, links]);

    const embeds = useMemo(() => {
        if (!postRawContent) return EMPTY_LIST;
        const lowerLinks = availableLinks.map((x) => x.toLowerCase());
        const embeds = [
            ...addresses
                .filter((x) => !lowerLinks.some((link) => link.includes(x.toLowerCase()))) // exclude addresses that are already in links
                .map((address) => ({ type: 'address', value: address })),
            ...availableLinks.map((link) => ({ type: 'url', value: link })),
        ] as EmbedEntry[];

        const lowercasePostContent = postRawContent.toLowerCase();
        return sortBy(embeds, (x) => lowercasePostContent.indexOf(x.value.toLowerCase()));
    }, [addresses, availableLinks, postRawContent]);

    if (!embeds.length) return null;

    return <EmbedCardsInner post={post} embeds={embeds} {...rest} />;
});
