/* eslint-disable @next/next/no-img-element */

import { SORTED_SOCIAL_ACCOUNT_AVATAR_SOURCE } from '@dimensiondev/constants/computed';
import { CACHE_AGE_INDEFINITE_ON_DISK } from '@dimensiondev/constants/static';
import type { ProfilePageSource, SocialSource } from '@dimensiondev/enums';
import { NetworkType, Source } from '@dimensiondev/enums';
import type { ApiContext } from '@dimensiondev/ssr';
import type { NextRequestContext } from '@dimensiondev/types';
import { runInSafeAsync, safeUnreachable } from '@dimensiondev/utils';
import { formatAddress, getAddressType } from '@dimensiondev/web3/utils';
import { compact, first } from 'lodash-es';
import type { NextRequest } from 'next/server.js';
import type { HTMLProps } from 'react';
import { z } from 'zod';

import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { fetchImageAsBase64 } from '@/helpers/fetchAvatarAsBase64.js';
import { getDefaultOgImageUrl } from '@/helpers/getDefaultOgImageUrl.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { getSharerHandle } from '@/helpers/getSharerHandle.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isSocialSource, isWalletSource } from '@/helpers/isSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getAllRelatedProfileInfo } from '@/providers/firefly/endpoint/getAllRelatedProfileInfo.js';
import type { WalletProfiles } from '@/providers/types/Firefly.js';
import { SourceSchema } from '@/schemas/Source.js';
import { getAllRelatedProfilesWithDefault } from '@/services/getAllRelatedProfilesWithDefault.js';
import { createOgImageResponse } from '@/services/og/createOgImageResponse.js';
import { getOgSatoriFonts, loadImageDataUri, loadSvgDataUri, type OgAssets } from '@/services/og/loadOgAsset.js';

const OG_AVATAR_SIZE = 284;
const BASE_FONT_FAMILY = ['Bedstead'];
const CJK_FONT_FAMILY = ['NotoSansSC'];
const CJK_CHARACTER_REGEX = /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u;

interface OgEnv {
    ASSETS: OgAssets;
}

async function loadProfileOgImages(assets: OgAssets) {
    const [
        background,
        fallbackAvatar,
        bskyCircle,
        bskyFill,
        ethCircle,
        farcaster,
        farcasterFill,
        fireflyCircle,
        lens,
        lensFill,
        solanaCircle,
        wallet,
        xCircleLight,
        xFill,
    ] = await Promise.all([
        loadImageDataUri(assets, '/image/profile-og-background.png'),
        loadImageDataUri(assets, '/image/firefly-light-avatar.png'),
        loadSvgDataUri(assets, '/svg/bsky-circle.svg'),
        loadSvgDataUri(assets, '/svg/bsky-fill.svg'),
        loadSvgDataUri(assets, '/svg/eth-circle.svg'),
        loadSvgDataUri(assets, '/svg/farcaster.svg'),
        loadSvgDataUri(assets, '/svg/farcaster-fill.svg'),
        loadSvgDataUri(assets, '/svg/firefly-circle2.svg'),
        loadSvgDataUri(assets, '/svg/lens.svg'),
        loadSvgDataUri(assets, '/svg/lens-fill.svg'),
        loadSvgDataUri(assets, '/svg/solana-circle.svg'),
        loadSvgDataUri(assets, '/svg/wallet3.svg'),
        loadSvgDataUri(assets, '/svg/x-circle-light.svg'),
        loadSvgDataUri(assets, '/svg/x-fill.svg'),
    ]);
    return {
        background,
        fallbackAvatar,
        bskyCircle,
        bskyFill,
        ethCircle,
        farcaster,
        farcasterFill,
        fireflyCircle,
        lens,
        lensFill,
        solanaCircle,
        wallet,
        xCircleLight,
        xFill,
    };
}

type ProfileOgImages = Awaited<ReturnType<typeof loadProfileOgImages>>;

function resolveSourceIcon(images: ProfileOgImages, source: ProfilePageSource) {
    return {
        [Source.Farcaster]: images.farcasterFill,
        [Source.Lens]: images.lensFill,
        [Source.Twitter]: images.xFill,
        [Source.Bsky]: images.bskyFill,
        [Source.Wallet]: images.wallet,
        [Source.WalletMix]: images.wallet,
    }[source];
}

function Image({ src, ...props }: Pick<HTMLProps<'img'>, 'src' | 'alt' | 'width' | 'height' | 'style'>) {
    return <img alt="img" {...props} src={src} />;
}

type ColoredSource = NetworkType | SocialSource | Source.Firefly;

function resolveColoredSourceIcon(images: ProfileOgImages, source: ColoredSource) {
    return {
        [Source.Farcaster]: images.farcaster,
        [Source.Lens]: images.lens,
        [Source.Twitter]: images.xCircleLight,
        [Source.Bsky]: images.bskyCircle,
        [Source.Firefly]: images.fireflyCircle,
        [NetworkType.Ethereum]: images.ethCircle,
        [NetworkType.Solana]: images.solanaCircle,
    }[source];
}

interface ProfileOpenGraphImageProps {
    avatar: string;
    displayName: string;
    source?: ColoredSource;
    sources?: ProfilePageSource[];
    sharerHandle?: string | null;
    images: ProfileOgImages;
}

function getFontPreferences(displayName: string): string[] {
    return CJK_CHARACTER_REGEX.test(displayName) ? [...CJK_FONT_FAMILY, ...BASE_FONT_FAMILY] : BASE_FONT_FAMILY;
}

async function ProfileOpenGraphImage({
    avatar,
    displayName,
    sources,
    source,
    sharerHandle,
    images,
}: ProfileOpenGraphImageProps) {
    const avatarBase64 = await fetchImageAsBase64(avatar, images.fallbackAvatar);
    const displayNameFontFamily = getFontPreferences(displayName);

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
                src={images.background}
                alt="og-background"
                style={{ position: 'absolute', top: 0, left: 0, width: '1200px', height: '630px', objectFit: 'cover' }}
                width={1200}
                height={630}
            />
            {sharerHandle ? (
                <div
                    style={{
                        position: 'absolute',
                        top: '24px',
                        left: '24px',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#767676',
                        fontFamily: BASE_FONT_FAMILY.join(','),
                        display: 'flex',
                    }}
                >
                    Shared by @{sharerHandle}
                </div>
            ) : null}
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
                            src={resolveColoredSourceIcon(images, source)}
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
                            fontFamily: displayNameFontFamily.join(','),
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
                                src={resolveSourceIcon(images, source)}
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

function walletProfilesToAvatar(profiles: WalletProfiles, fallbackAvatar: string) {
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
    return socialAvatar ?? fallbackAvatar;
}

async function createProfileOpenGraphImageResponse(
    props: Omit<ProfileOpenGraphImageProps, 'images'> & { images: ProfileOgImages },
    origin: string,
    assets: OgAssets,
) {
    return createOgImageResponse(await ProfileOpenGraphImage(props), {
        width: 1200,
        height: 630,
        fonts: await getOgSatoriFonts(getFontPreferences(props.displayName), origin, assets),
        cacheControl: CACHE_AGE_INDEFINITE_ON_DISK as string,
    });
}

const ParamsSchema = z.object({
    id: z.string().optional(),
    source: SourceSchema,
    debug: z.coerce.boolean().default(false),
});

const getHandler = async (request: NextRequest, context?: NextRequestContext, env?: OgEnv) => {
    const { id, source } = await getParamsWithZodSchema(ParamsSchema, context);
    if (!id || !source)
        return createProxyImageResponse(getDefaultOgImageUrl(), (path) =>
            env!.ASSETS.fetch(new Request(new URL(path, request.url))),
        );

    const origin = new URL(request.url).origin;
    const assets = env!.ASSETS;
    const [sharerHandle, images] = await Promise.all([
        getSharerHandle(new URL(request.url).searchParams.get('sid')),
        loadProfileOgImages(assets),
    ]);

    if (source === Source.Firefly) {
        const profiles = await getAllRelatedProfileInfo({ uid: id });
        if (!profiles.account)
            return createProxyImageResponse(getDefaultOgImageUrl(), (path) =>
                env!.ASSETS.fetch(new Request(new URL(path, request.url))),
            );

        const avatar = walletProfilesToAvatar(profiles, images.fallbackAvatar);
        return createProfileOpenGraphImageResponse(
            {
                avatar,
                displayName: profiles.account.displayName ?? 'Firefly User',
                source: Source.Firefly,
                sources: walletProfilesToSources(profiles),
                sharerHandle,
                images,
            },
            origin,
            assets,
        );
    }

    if (!isSocialSource(source) && !isWalletSource(source)) {
        return createProxyImageResponse(getDefaultOgImageUrl(), (path) =>
            env!.ASSETS.fetch(new Request(new URL(path, request.url))),
        );
    }

    const identity = { source, id };
    const profiles = await runInSafeAsync(() => getAllRelatedProfilesWithDefault(identity));

    if (isWalletSource(source)) {
        const networkType = getAddressType(id);
        if (!networkType)
            return createProxyImageResponse(getDefaultOgImageUrl(), (path) =>
                env!.ASSETS.fetch(new Request(new URL(path, request.url))),
            );

        return createProfileOpenGraphImageResponse(
            {
                avatar: getStampAvatarByProfileId(Source.Wallet, id, OG_AVATAR_SIZE * 2),
                displayName: formatAddress(id, 4),
                source: networkType,
                sources: walletProfilesToSources(profiles),
                sharerHandle,
                images,
            },
            origin,
            assets,
        );
    }

    const profile = await runInSafeAsync(() =>
        resolveSocialMediaProvider(source as SocialSource).getProfileByIdOrHandle(id),
    );
    if (!profile)
        return createProxyImageResponse(getDefaultOgImageUrl(), (path) =>
            env!.ASSETS.fetch(new Request(new URL(path, request.url))),
        );

    return createProfileOpenGraphImageResponse(
        {
            avatar: profile.pfp,
            displayName: profile.displayName,
            source: profile.source,
            sources: walletProfilesToSources(profiles),
            sharerHandle,
            images,
        },
        origin,
        assets,
    );
};

export function GET({ request, params, env }: ApiContext<OgEnv>) {
    // withRequestErrorHandler's wrapper only forwards (request, context), so
    // bind env via closure instead of a third argument.
    const handler = withRequestErrorHandler()(((req: NextRequest, context?: NextRequestContext) =>
        getHandler(req, context, env)) as never) as (
        request: NextRequest,
        context?: NextRequestContext,
    ) => Promise<Response>;
    return handler(request as NextRequest, { params } as never);
}
