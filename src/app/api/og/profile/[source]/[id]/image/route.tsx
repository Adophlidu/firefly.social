/* eslint-disable @next/next/no-img-element */

import { compact, first } from 'lodash-es';
import { ImageResponse } from 'next/og.js';
import type { NextRequest } from 'next/server.js';
import type { HTMLProps } from 'react';
import urlcat from 'urlcat';
import { z } from 'zod';

import ColoredBskySVG from '@/assets/bsky-circle.svg?url';
import BskySVG from '@/assets/bsky-fill.svg?url';
import ColoredEthSVG from '@/assets/eth-circle.svg?url';
import ColoredFarcasterSVG from '@/assets/farcaster.svg?url';
import FarcasterSVG from '@/assets/farcaster-fill.svg?url';
import ColoredFireflySVG from '@/assets/firefly-circle2.svg?url';
import ColoredLensSVG from '@/assets/lens.svg?url';
import LensSVG from '@/assets/lens-fill.svg?url';
import ColoredSolanaSVG from '@/assets/solana-circle.svg?url';
import WalletSVG from '@/assets/wallet3.svg?url';
import ColoredTwitterSVG from '@/assets/x-circle-light.svg?url';
import TwitterSVG from '@/assets/x-fill.svg?url';
import { NetworkType, type ProfilePageSource, type SocialSource, Source, SourceInURL } from '@/constants/enum.js';
import { CACHE_AGE_INDEFINITE_ON_DISK, SITE_URL, SORTED_SOCIAL_ACCOUNT_AVATAR_SOURCE } from '@/constants/index.js';
import { compose } from '@/helpers/compose.js';
import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { fetchAvatarAsBase64 } from '@/helpers/fetchAvatarAsBase64.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isSocialSource, isWalletSource } from '@/helpers/isSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSource } from '@/helpers/resolveSource.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getAllRelatedProfileInfo } from '@/providers/firefly/getAllRelatedProfileInfo.js';
import type { WalletProfiles } from '@/providers/types/Firefly.js';
import { getAllRelatedProfilesWithDefault } from '@/services/getAllRelatedProfilesWithDefault.js';
import { getSatoriFonts } from '@/services/getSatoriFonts.js';
import type { NextRequestContext } from '@/types/utility.js';

const OG_FALLBACK_AVATAR = urlcat(SITE_URL, '/image/firefly-light-avatar.png');
const OG_BACKGROUND = urlcat(SITE_URL, '/image/profile-og-background.png');
const OG_AVATAR_SIZE = 284;
const OG_FONT_FAMILY = 'Bedstead';

function resolveSourceIcon(source: ProfilePageSource) {
    return {
        [Source.Farcaster]: FarcasterSVG,
        [Source.Lens]: LensSVG,
        [Source.Twitter]: TwitterSVG,
        [Source.Bsky]: BskySVG,
        [Source.Wallet]: WalletSVG,
        [Source.WalletMix]: WalletSVG,
    }[source];
}

function Image({ src, ...props }: Pick<HTMLProps<'img'>, 'src' | 'alt' | 'width' | 'height' | 'style'>) {
    return <img alt="img" {...props} src={src} />;
}

type ColoredSource = NetworkType | SocialSource | Source.Firefly;

function resolveColoredSourceIcon(source: ColoredSource) {
    return {
        [Source.Farcaster]: ColoredFarcasterSVG,
        [Source.Lens]: ColoredLensSVG,
        [Source.Twitter]: ColoredTwitterSVG,
        [Source.Bsky]: ColoredBskySVG,
        [Source.Firefly]: ColoredFireflySVG,
        [NetworkType.Ethereum]: ColoredEthSVG,
        [NetworkType.Solana]: ColoredSolanaSVG,
    }[source];
}

interface ProfileOpenGraphImageProps {
    avatar: string;
    displayName: string;
    source?: ColoredSource;
    sources?: ProfilePageSource[];
}

async function ProfileOpenGraphImage({ avatar, displayName, sources, source }: ProfileOpenGraphImageProps) {
    const avatarBase64 = (await fetchAvatarAsBase64(avatar)) ?? OG_FALLBACK_AVATAR;

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                background: '#fff',
                padding: '25px',
                position: 'relative',
            }}
        >
            <Image
                src={OG_BACKGROUND}
                alt="og-background"
                style={{ position: 'absolute', top: 0, left: 0, width: '1200px', height: '630px', objectFit: 'cover' }}
                width={1200}
                height={630}
            />
            <div
                style={{
                    position: 'absolute',
                    top: '125px',
                    left: '0',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <div
                    style={{
                        width: '284px',
                        height: '284px',
                        display: 'flex',
                        position: 'relative',
                    }}
                >
                    <Image
                        src={avatarBase64}
                        alt="og-avatar"
                        style={{
                            width: `${OG_AVATAR_SIZE}px`,
                            height: `${OG_AVATAR_SIZE}px`,
                            borderRadius: '200px',
                            objectFit: 'cover',
                        }}
                        width={OG_AVATAR_SIZE}
                        height={OG_AVATAR_SIZE}
                    />
                    {source ? (
                        <Image
                            src={resolveColoredSourceIcon(source)}
                            alt={source}
                            width={56}
                            height={56}
                            style={{
                                backgroundColor: '#fff',
                                position: 'absolute',
                                bottom: '4px',
                                right: '12px',
                                display: 'flex',
                                border: '2px solid #fff',
                                width: '56px',
                                height: '56px',
                                borderRadius: '100%',
                            }}
                        />
                    ) : null}
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: '750px',
                        paddingTop: '16px',
                        paddingBottom: '16px',
                        alignItems: 'center',
                        color: '#07101B',
                        fontSize: '56px',
                        lineHeight: '56px',
                        height: '88px',
                    }}
                >
                    <div
                        style={{
                            lineClamp: 1,
                            whiteSpace: 'nowrap',
                            wordWrap: 'break-word',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontFamily: OG_FONT_FAMILY,
                            fontWeight: '700',
                            width: 'auto',
                            maxWidth: '750px',
                        }}
                    >
                        {displayName}
                    </div>
                </div>
                {sources && sources?.length > 1 ? (
                    <div
                        style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {sources.map((source) => (
                            <Image
                                src={resolveSourceIcon(source)}
                                alt={source}
                                key={source}
                                width={32}
                                height={32}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                }}
                            />
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function walletProfilesToSources(profiles?: WalletProfiles) {
    return profiles
        ? compact([
              profiles.twitterProfiles.length > 0 ? Source.Twitter : null,
              profiles.lensProfilesV3.length > 0 ? Source.Lens : null,
              profiles.farcasterProfiles.length > 0 ? Source.Farcaster : null,
              profiles.bskyProfiles.length > 0 ? Source.Bsky : null,
              profiles.walletProfiles.length > 0 || profiles.solanaWalletProfiles.length > 0 ? Source.Wallet : null,
          ])
        : [];
}

function walletProfilesToAvatar(profiles: WalletProfiles) {
    if (profiles.account?.avatar) {
        if (!profiles.account?.avatar?.includes('stamp.firefly.land')) {
            return profiles.account?.avatar;
        }
    }
    const avatars = compact(
        SORTED_SOCIAL_ACCOUNT_AVATAR_SOURCE.flatMap((source) => {
            switch (source) {
                case Source.Bsky:
                    return profiles.bskyProfiles.map((x) => ({ source: Source.Bsky, id: x.did }));
                case Source.Twitter:
                    return profiles.twitterProfiles.map((x) => ({ source: Source.Twitter, id: x.twitter_id }));
                case Source.Farcaster:
                    return profiles.farcasterProfiles.map((x) => ({ source: Source.Farcaster, id: `${x.id}` }));
                case Source.Lens:
                    return profiles.lensProfilesV3.map((x) => ({ source: Source.Lens, id: x.id }));
                default:
                    safeUnreachable(source);
                    return null;
            }
        }),
    ).map(({ source, id }) => getStampAvatarByProfileId(source, id, OG_AVATAR_SIZE * 2));
    const socialAvatar = first(avatars);
    if (!socialAvatar && profiles.account?.uid)
        return getStampAvatarByProfileId(Source.Firefly, profiles.account.uid, OG_AVATAR_SIZE * 2);
    return socialAvatar;
}

async function createProfileOpenGraphImageResponse({
    debug,
    ...props
}: ProfileOpenGraphImageProps & {
    debug?: boolean;
}) {
    return new ImageResponse(await ProfileOpenGraphImage(props), {
        width: 1200,
        height: 630,
        debug,
        fonts: await getSatoriFonts([OG_FONT_FAMILY]),
        headers: {
            'Cache-Control': CACHE_AGE_INDEFINITE_ON_DISK,
        },
    });
}

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest, context?: NextRequestContext) => {
    const id = (await context?.params)?.id;
    if (!id) return createProxyImageResponse(urlcat(SITE_URL, '/image/og.png'));
    const source = resolveSource((await context?.params)?.source as SourceInURL);
    const debug = z.boolean().safeParse(request.nextUrl.searchParams.has('debug')).data;

    if (source === Source.Firefly) {
        const profiles = await getAllRelatedProfileInfo({ uid: id });
        if (!profiles.account) return createProxyImageResponse(urlcat(SITE_URL, '/image/og.png'));
        const avatar = walletProfilesToAvatar(profiles) ?? OG_FALLBACK_AVATAR;
        return createProfileOpenGraphImageResponse({
            avatar,
            displayName: profiles.account.displayName ?? 'Firefly User',
            source: Source.Firefly,
            sources: walletProfilesToSources(profiles),
            debug,
        });
    }

    if (!isSocialSource(source) && !isWalletSource(source)) {
        return createProxyImageResponse(urlcat(SITE_URL, '/image/og.png'));
    }
    const identity = { source, id };
    const profiles = await runInSafeAsync(() => getAllRelatedProfilesWithDefault(identity));

    if (isWalletSource(source)) {
        const networkType = getAddressType(id);
        if (!networkType) return createProxyImageResponse(urlcat(SITE_URL, '/image/og.png'));
        return createProfileOpenGraphImageResponse({
            avatar: getStampAvatarByProfileId(Source.Wallet, id, OG_AVATAR_SIZE * 2),
            displayName: formatAddress(id, 4),
            source: networkType,
            sources: walletProfilesToSources(profiles),
            debug,
        });
    }

    const provider = resolveSocialMediaProvider(source as SocialSource);
    const profile = await runInSafeAsync(() => provider.getProfileByIdOrHandle(id));
    if (!profile) {
        return createProxyImageResponse(urlcat(SITE_URL, '/image/og.png'));
    }
    return createProfileOpenGraphImageResponse({
        avatar: profile.pfp,
        displayName: profile.displayName,
        source: profile.source,
        sources: walletProfilesToSources(profiles),
        debug,
    });
});
