/* eslint-disable @next/next/no-img-element */

import { CACHE_AGE_INDEFINITE_ON_DISK } from '@dimensiondev/constants/static';
import { type SocialSource, Source } from '@dimensiondev/enums';
import type { NextRequestContext } from '@dimensiondev/types';
import { compose, safeUnreachable } from '@dimensiondev/utils';
import { ImageResponse } from 'next/og.js';
import type { NextRequest } from 'next/server.js';
import type { HTMLProps } from 'react';
import { z } from 'zod';

import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { fetchImageAsBase64 } from '@/helpers/fetchAvatarAsBase64.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { getDefaultOgImageUrl } from '@/helpers/getDefaultOgImageUrl.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { getPublicUrl } from '@/helpers/getPublicUrl.js';
import { resolveChannelName } from '@/helpers/resolveChannelName.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import { SocialSourceSchema } from '@/schemas/Source.js';
import { getSatoriFonts } from '@/services/getSatoriFonts.js';

const OG_FALLBACK_AVATAR = getPublicUrl('/image/firefly-light-avatar.png');
const OG_BACKGROUND = getPublicUrl('/image/profile-og-background.png');
const OG_AVATAR_SIZE = 284;
const BASE_FONT_FAMILY = ['Bedstead'];
const CJK_FONT_FAMILY = ['NotoSansSC'];
const CJK_CHARACTER_REGEX = /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u;

const ColoredBskySVG = getPublicUrl('/svg/bsky-circle.svg');
const ColoredFarcasterSVG = getPublicUrl('/svg/farcaster.svg');
const ColoredLensSVG = getPublicUrl('/svg/lens.svg');
const ColoredTwitterSVG = getPublicUrl('/svg/x-circle-light.svg');

function resolveColoredSourceIcon(source: SocialSource) {
    return {
        [Source.Farcaster]: ColoredFarcasterSVG,
        [Source.Lens]: ColoredLensSVG,
        [Source.Twitter]: ColoredTwitterSVG,
        [Source.Bsky]: ColoredBskySVG,
    }[source];
}

function Image({ src, ...props }: Pick<HTMLProps<'img'>, 'src' | 'alt' | 'width' | 'height' | 'style'>) {
    return <img alt="img" {...props} src={src} />;
}

function getFontPreferences(text: string): string[] {
    return CJK_CHARACTER_REGEX.test(text) ? [...CJK_FONT_FAMILY, ...BASE_FONT_FAMILY] : BASE_FONT_FAMILY;
}

function formatFollowerLabel(source: SocialSource, count: number) {
    switch (source) {
        case Source.Bsky:
            return count === 1 ? 'Like' : 'Likes';
        case Source.Farcaster:
            return count === 1 ? 'Follower' : 'Followers';
        case Source.Lens:
        case Source.Twitter:
            return count === 1 ? 'Member' : 'Members';
        default:
            safeUnreachable(source);
            return count === 1 ? 'Member' : 'Members';
    }
}

function formatChannelSubtitle(channel: Channel) {
    const parts: string[] = [];

    if ([Source.Lens, Source.Bsky].includes(channel.source)) {
        if (channel.lead?.handle) {
            parts.push(`By @${channel.lead.handle}`);
        }
    } else {
        parts.push(`/${channel.id}`);
    }

    parts.push(`${nFormatter(channel.followerCount)} ${formatFollowerLabel(channel.source, channel.followerCount)}`);
    return parts.join(' · ');
}

interface ChannelOpenGraphImageProps {
    channel: Channel;
}

async function ChannelOpenGraphImage({ channel }: ChannelOpenGraphImageProps) {
    const displayName = resolveChannelName(channel);
    const subtitle = formatChannelSubtitle(channel);
    const avatarBase64 = await fetchImageAsBase64(channel.imageUrl, OG_FALLBACK_AVATAR);
    const displayNameFontFamily = getFontPreferences(displayName);
    const subtitleFontFamily = getFontPreferences(subtitle);

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
                    <Image
                        src={resolveColoredSourceIcon(channel.source)}
                        alt={channel.source}
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
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: '750px',
                        paddingTop: '16px',
                        paddingBottom: '8px',
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
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: '750px',
                        color: '#767676',
                        fontSize: '28px',
                        lineHeight: '36px',
                        fontFamily: subtitleFontFamily.join(','),
                        fontWeight: 400,
                    }}
                >
                    <div
                        style={{
                            lineClamp: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '750px',
                        }}
                    >
                        {subtitle}
                    </div>
                </div>
            </div>
        </div>
    );
}

async function createChannelOpenGraphImageResponse({ channel }: ChannelOpenGraphImageProps) {
    const displayName = resolveChannelName(channel);
    const subtitle = formatChannelSubtitle(channel);

    return new ImageResponse(await ChannelOpenGraphImage({ channel }), {
        width: 1200,
        height: 630,
        fonts: await getSatoriFonts([...new Set([...getFontPreferences(displayName), ...getFontPreferences(subtitle)])]),
        headers: {
            'Cache-Control': CACHE_AGE_INDEFINITE_ON_DISK,
        },
    });
}

const ParamsSchema = z.object({
    id: z.string().optional(),
    source: SocialSourceSchema,
});

export const GET = compose(withRequestErrorHandler(), async (_request: NextRequest, context?: NextRequestContext) => {
    const { id, source } = await getParamsWithZodSchema(ParamsSchema, context);
    if (!id || !source) return createProxyImageResponse(getDefaultOgImageUrl());

    const channel = await resolveSocialMediaProvider(source).getChannelById(id);
    if (!channel) return createProxyImageResponse(getDefaultOgImageUrl());

    return createChannelOpenGraphImageResponse({ channel });
});
