'use client';

import { safeUnreachable } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';
import urlcat from 'urlcat';
import { isAddress } from 'viem';

import { ErrorBoundary } from '@/components/ErrorBoundary/index.js';
import { Link } from '@/components/Link.js';
import { AddressTag } from '@/components/Markup/MarkupLink/AddressTag.js';
import { ChannelTag } from '@/components/Markup/MarkupLink/ChannelTag.js';
import { DomainTag } from '@/components/Markup/MarkupLink/DomainTag.js';
import { ExternalLink } from '@/components/Markup/MarkupLink/ExternalLink.js';
import { Hashtag } from '@/components/Markup/MarkupLink/Hashtag.js';
import { MentionLink } from '@/components/Markup/MarkupLink/MentionLink.js';
import { NFTCard } from '@/components/Markup/MarkupLink/NFTCard.js';
import { NFTCollection } from '@/components/Markup/MarkupLink/NFTCollection.js';
import { SymbolTag } from '@/components/Markup/MarkupLink/SymbolTag.js';
import { TcoLink } from '@/components/Markup/MarkupLink/TcoLink.js';
import { ToggleMore } from '@/components/Markup/MarkupLink/ToggleMore.js';
import type { MarkupLinkProps } from '@/components/Markup/MarkupLink/type.js';
import { ProfileTippy } from '@/components/Profile/ProfileTippy.js';
import { Source } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/index.js';
import { BIO_TWITTER_PROFILE_REGEX, EMAIL_REGEX, FULL_ENS_REGEXP, LENS_HANDLE_REGEXP } from '@/constants/regexp.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { getLensHandleFromMentionTitle } from '@/helpers/getLensHandleFromMentionTitle.js';
import { getProfileUrl, getTwitterProfileUrl } from '@/helpers/getProfileUrl.js';
import { isValidDomain } from '@/helpers/isValidDomain.js';
import { isValidSolanaAddress } from '@/helpers/isValidSolanaAddress.js';
import { isTCOLink } from '@/helpers/resolveTCOLink.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';

export const MarkupLink = memo<MarkupLinkProps>(function MarkupLink({ title, post, source, sourceLink }) {
    const { data: fallbackProfile } = useQuery({
        // We only have handle in user bio.
        enabled: !post && source === Source.Farcaster && title?.startsWith('@'),
        queryKey: ['profile-by-handle', source, title],
        queryFn: async () => {
            if (!title) return null;
            const handle = title.slice(1);
            return FireflySocialMediaProvider.getProfileByHandle(handle);
        },
    });

    if (!title) return null;

    if (title.startsWith('@')) {
        if (!source) return title;

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
                const profile = post
                    ? post.mentions?.find((x) => x.handle === title.replace(/^@/, ''))
                    : fallbackProfile;
                if (!profile) return title;

                const link = getProfileUrl(profile);
                return (
                    <ProfileTippy
                        identity={{
                            source: Source.Farcaster,
                            id: profile.profileId,
                        }}
                    >
                        <MentionLink handle={profile.handle} href={link} className="inline-block" />
                    </ProfileTippy>
                );
            }

            case Source.Twitter:
                const profile = post?.mentions?.find((x) => x.handle === title.replace(/^@/, ''));
                if (!profile) return title;
                return (
                    <ProfileTippy
                        identity={{
                            source: Source.Twitter,
                            id: profile.profileId,
                        }}
                    >
                        <MentionLink handle={profile.handle} href={getProfileUrl(profile)} className="inline-block" />
                    </ProfileTippy>
                );
            case Source.Bsky: {
                const profile = post?.mentions?.find((x) => x.handle === title.replace(/^@/, ''));
                if (!profile) return title;
                return (
                    <ProfileTippy
                        identity={{
                            source: Source.Bsky,
                            id: profile.profileId,
                        }}
                    >
                        <MentionLink handle={profile.handle} href={getProfileUrl(profile)} className="inline-block" />
                    </ProfileTippy>
                );
            }
            default:
                safeUnreachable(source);
                return title;
        }
    }

    const trimmed = title.trim();
    const tagPadding = title.startsWith(' ') ? ' ' : null;
    if (trimmed.startsWith('#')) {
        if (trimmed === '#SYSTOGGLEMORE' && post) {
            return <ToggleMore post={post} />;
        }
        return (
            <>
                {tagPadding}
                <Hashtag title={trimmed} source={source} />
            </>
        );
    }
    if (trimmed.startsWith('$'))
        return (
            <>
                {tagPadding}
                <SymbolTag title={trimmed} source={source} />
            </>
        );

    if (isAddress(trimmed) || (isValidSolanaAddress(trimmed) as boolean)) {
        return <AddressTag title={trimmed} address={trimmed} source={source} />;
    }

    if (trimmed.startsWith('/')) {
        return (
            <>
                {tagPadding}
                <ChannelTag title={trimmed} source={source} />
            </>
        );
    }

    if (LENS_HANDLE_REGEXP.test(title)) {
        const handle = title.replace('.lens', '');
        return (
            <Link
                href={urlcat(SITE_URL, '/profile/lens/:handle', { handle })}
                className="text-highlight hover:underline"
                onClick={stopPropagation}
                target="_blank"
                rel="noreferrer noopener"
            >
                {title}
            </Link>
        );
    }

    if (trimmed.match(FULL_ENS_REGEXP)) {
        return (
            <>
                {tagPadding}
                <ErrorBoundary message={`Failed to render domain tag for ${trimmed}`}>
                    <DomainTag title={trimmed} source={source} />;
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

    if (isValidDomain(title)) return title;

    if (EMAIL_REGEX.test(title)) return title;

    if (BIO_TWITTER_PROFILE_REGEX.test(title)) {
        const match = title.match(BIO_TWITTER_PROFILE_REGEX);
        if (!match) return title;
        const href = getTwitterProfileUrl(match[1]);
        return (
            <Link
                href={href}
                className="text-highlight hover:underline"
                onClick={stopPropagation}
                target="_blank"
                rel="noreferrer noopener"
            >
                {title}
            </Link>
        );
    }

    if (isTCOLink(title)) {
        return <TcoLink title={title} post={post} />;
    }

    return <ExternalLink title={title} />;
});
