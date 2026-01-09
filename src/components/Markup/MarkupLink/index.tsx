'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { memo } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary/index.js';
import { Link } from '@/components/Link.js';
import { AddressTag } from '@/components/Markup/MarkupLink/AddressTag.js';
import { ChannelTag } from '@/components/Markup/MarkupLink/ChannelTag.js';
import { DomainTag } from '@/components/Markup/MarkupLink/DomainTag.js';
import { ExternalLink } from '@/components/Markup/MarkupLink/ExternalLink.js';
import { Hashtag } from '@/components/Markup/MarkupLink/Hashtag.js';
import { MentionLink } from '@/components/Markup/MarkupLink/MentionLink.js';
import { MentionLinkWithQueryProfile } from '@/components/Markup/MarkupLink/MentionLinkWithQueryProfile.js';
import { NFTCard } from '@/components/Markup/MarkupLink/NFTCard.js';
import { NFTCollection } from '@/components/Markup/MarkupLink/NFTCollection.js';
import { SymbolTag } from '@/components/Markup/MarkupLink/SymbolTag.js';
import { TcoLink } from '@/components/Markup/MarkupLink/TcoLink.js';
import { ToggleMore } from '@/components/Markup/MarkupLink/ToggleMore.js';
import { type MarkupLinkProps } from '@/components/Markup/MarkupLink/type.js';
import { ProfileTippy } from '@/components/Profile/ProfileTippy.js';
import { Source } from '@/constants/enum.js';
import {
    BIO_TWITTER_PROFILE_REGEX,
    EMAIL_REGEX,
    FULL_ENS_REGEXP,
    LENS_HANDLE_REGEXP,
    SPECIAL_TOKEN_SYMBOLS,
} from '@/constants/regexp.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { isValidDomainEthereum } from '@/helpers/isValidDomain.js';
import { isTcoLink } from '@/helpers/resolveTcoLink.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { getLensHandleFromMentionTitle } from '@/providers/lens/getLensHandleFromMentionTitle.js';

function unpaddings(text: string) {
    const start = text.match(/(^\s)/)?.[0] || null;
    const end = text.match(/(\s+$)/)?.[0] || null;
    const trimmed = text.trim();
    return { start, end, trimmed };
}

export const MarkupLink = memo<MarkupLinkProps>(function MarkupLink({ title, post, source, sourceLink, profile }) {
    if (!title) return null;

    if (title.startsWith('@')) {
        if (!source) return title;
        const handle = title.replace(/^@/, '');

        switch (source) {
            case Source.Lens: {
                const handle = getLensHandleFromMentionTitle(title);
                if (!handle) return title;
                const link = getProfileUrl({
                    ...createDummyProfile(Source.Lens),
                    handle,
                });
                return (
                    <ProfileTippy
                        identity={{
                            source: Source.Lens,
                            id: handle,
                        }}
                    >
                        <MentionLink handle={handle} href={link} className="inline-block" />
                    </ProfileTippy>
                );
            }

            case Source.Farcaster: {
                const bioMention = profile?.bioContext?.mentions?.find((x) => [handle, title].includes(x.id));
                const postMention = post?.mentions?.find((x) => [handle, title].includes(x.handle));
                if (!postMention && !bioMention)
                    return <MentionLinkWithQueryProfile source={source} handle={handle} fallback={title} />;
                return (
                    <ProfileTippy
                        identity={{
                            source: Source.Farcaster,
                            id: handle,
                        }}
                    >
                        <MentionLink
                            handle={handle}
                            href={getProfileUrl({ source, handle })}
                            className="inline-block"
                        />
                    </ProfileTippy>
                );
            }

            case Source.Twitter:
                if (post?.isTruthSocial) {
                    return <MentionLink handle={handle} href={`https://truthsocial.com/@${handle}`} />;
                }
                const bioMention = profile?.bioContext?.mentions?.find((x) => x.id === handle);
                const postMention = post?.mentions?.find(
                    (x) =>
                        x.handle.toLowerCase() === handle.toLowerCase() ||
                        x.handle.toLowerCase() === title.toLowerCase(),
                );
                if (!bioMention && !postMention) {
                    return <MentionLinkWithQueryProfile source={source} handle={handle} fallback={title} />;
                }
                return (
                    <ProfileTippy
                        identity={{
                            source,
                            id: handle,
                        }}
                    >
                        <MentionLink
                            handle={handle}
                            href={getProfileUrl(postMention ? postMention : { source, handle })}
                            className="inline-block"
                        />
                    </ProfileTippy>
                );
            case Source.Bsky: {
                const bioMention = profile?.bioContext?.mentions?.find((x) => [handle, title].includes(x.id));
                const postMention = post?.mentions?.find((x) => x.handle === handle || x.handle === title);
                if (!postMention && !bioMention) {
                    return <MentionLinkWithQueryProfile source={source} handle={handle} fallback={title} />;
                }
                return (
                    <ProfileTippy
                        identity={{
                            source: Source.Bsky,
                            id: handle,
                        }}
                    >
                        <MentionLink
                            handle={handle}
                            href={getProfileUrl(postMention ? postMention : { source, handle })}
                            className="inline-block"
                        />
                    </ProfileTippy>
                );
            }
            default:
                safeUnreachable(source);
                return title;
        }
    }

    const { start, end, trimmed } = unpaddings(title);
    if (trimmed.startsWith('#')) {
        if (trimmed === '#SYSTOGGLEMORE' && post) {
            return <ToggleMore post={post} />;
        }
        const group = post?.groups?.find((x) => x.name === trimmed);
        return (
            <>
                {start}
                {group ? (
                    <ChannelTag title={trimmed} source={source} id={group.id} />
                ) : (
                    <Hashtag title={trimmed} source={source} />
                )}
                {end}
            </>
        );
    }
    if (trimmed.startsWith('$'))
        return (
            <>
                {start}
                <SymbolTag title={trimmed} source={source} />
                {end}
            </>
        );
    if (SPECIAL_TOKEN_SYMBOLS.includes(trimmed.toLowerCase())) {
        return (
            <>
                {start}
                <SymbolTag title={trimmed} source={source} />
                {end}
            </>
        );
    }

    if (isValidAddressEthereum(trimmed) || (isValidAddressSolana(trimmed) as boolean)) {
        return <AddressTag title={trimmed} address={trimmed} source={source} />;
    }

    if (trimmed.startsWith('/')) {
        return (
            <>
                {start}
                <ChannelTag title={trimmed} source={source} />
                {end}
            </>
        );
    }

    if (LENS_HANDLE_REGEXP.test(title)) {
        const handle = title.replace('.lens', '');
        const href = getProfileUrl({ source: Source.Lens, handle });
        return (
            <Link href={href} className="text-highlight hover:underline" onClick={stopPropagation}>
                {title}
            </Link>
        );
    }

    if (trimmed.match(FULL_ENS_REGEXP)) {
        return (
            <>
                {start}
                <ErrorBoundary message={`Failed to render domain tag for ${trimmed}`}>
                    <DomainTag title={trimmed} source={source} />
                </ErrorBoundary>
            </>
        );
    }

    if (title.startsWith('nft://') && sourceLink) {
        const [chainId, contractAddress, last] = title.replace('nft://', '').split('/');
        const tokenId = last.split('?')[0];
        if (!chainId || !contractAddress) return;
        if (tokenId)
            return (
                <NFTCard
                    sourceLink={sourceLink}
                    chainId={Number.parseInt(chainId, 10)}
                    contractAddress={contractAddress}
                    tokenId={tokenId}
                />
            );
        return (
            <NFTCollection
                sourceLink={sourceLink}
                chainId={Number.parseInt(chainId, 10)}
                contractAddress={contractAddress}
            />
        );
    }

    if (isValidDomainEthereum(title)) return title;

    if (EMAIL_REGEX.test(title)) return title;

    if (BIO_TWITTER_PROFILE_REGEX.test(title)) {
        const match = title.match(BIO_TWITTER_PROFILE_REGEX);
        if (!match) return title;
        const href = getProfileUrl({ source: Source.Twitter, handle: match[1] });
        return (
            <Link href={href} className="text-highlight hover:underline" onClick={stopPropagation}>
                {title}
            </Link>
        );
    }

    if (isTcoLink(title)) {
        return <TcoLink title={title} post={post} />;
    }

    return (
        <>
            {start}
            <ExternalLink title={trimmed} />
            {end}
        </>
    );
});
