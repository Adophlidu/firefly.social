/* eslint-disable @next/next/no-img-element */

import { compose } from '@dimensiondev/utils';
import dayjs from 'dayjs';
import { ImageResponse } from 'next/og.js';
import type { NextRequest } from 'next/server.js';
import type { HTMLProps } from 'react';
import urlcat from 'urlcat';
import { z } from 'zod';

import { type SocialSource, Source } from '@/constants/enum.js';
import { CACHE_AGE_INDEFINITE_ON_DISK, SITE_URL } from '@/constants/index.js';
import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { getImageMetaFromUrl } from '@/helpers/getImageMetaFromUrl.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { getPublicSvgUrl } from '@/helpers/getPublicSvgUrl.js';
import { removeCombiningCharacters } from '@/helpers/removeCombiningCharacters.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { Attachment, Post } from '@/providers/types/SocialMedia.js';
import { SocialSourceSchema } from '@/schemas/Source.js';
import { getSatoriFonts } from '@/services/getSatoriFonts.js';
import type { NextRequestContext } from '@/types/utility.js';

const OG_FONT_FAMILY = ['Inter', 'Noto Sans Symbols 2'];

const BskySVG = getPublicSvgUrl('bsky-circle.svg');
const FarcasterSVG = getPublicSvgUrl('farcaster.svg');
const LensSVG = getPublicSvgUrl('lens.svg');
const OGBackgroundSVG = getPublicSvgUrl('og-background.svg');
const TwitterSVG = getPublicSvgUrl('x-circle-light.svg');

function resolveSourceIcon(source: SocialSource) {
    return {
        [Source.Farcaster]: FarcasterSVG,
        [Source.Lens]: LensSVG,
        [Source.Twitter]: TwitterSVG,
        [Source.Bsky]: BskySVG,
    }[source];
}

function resolveAttachmentsSrc(asset?: Attachment) {
    if (!asset) return null;

    switch (asset.type) {
        case 'Image':
            return asset.uri;
        case 'Video':
        case 'AnimatedGif':
            return asset.coverUri;
        default:
            return null;
    }
}

function Image({ src, ...props }: Pick<HTMLProps<'img'>, 'src' | 'alt' | 'width' | 'height' | 'style'>) {
    return <img alt="img" {...props} src={src} />;
}

async function AttachmentImage({ src }: { src: string }) {
    const imageMeta = await getImageMetaFromUrl(src);
    if (!imageMeta) return null;

    const maxSize = 280;
    const { width, height } = imageMeta;
    const scale = Math.max(width, height) === 0 ? 1 : maxSize / Math.max(width, height);
    const scaledWidth = Math.round(width * scale);
    const scaledHeight = Math.round(height * scale);

    return (
        <div
            style={{
                display: 'flex',
                position: 'absolute',
                top: '-16px',
                right: '80px',
                width: `${maxSize}px`,
                height: `${maxSize}px`,
                alignItems: 'flex-start',
                justifyContent: 'center',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    position: 'relative',
                    width: `${scaledWidth}px`,
                    height: `${scaledHeight}px`,
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: '-24px',
                        height: '24px',
                        left: '24px',
                        background: '#C7CAFF',
                        width: `${scaledWidth - 24}px`,
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        width: '24px',
                        right: '-24px',
                        background: '#C7CAFF',
                        height: `${scaledHeight - 24}px`,
                    }}
                />
                <Image
                    src={src}
                    alt="image"
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                />
            </div>
        </div>
    );
}

async function PostOpenGraphImage({ post }: { post: Post }) {
    const src = resolveAttachmentsSrc(post.metadata.content?.asset);
    const content = (post.metadata.content?.content ?? '')
        .split('\n')
        .map((x) => x.trim())
        .join('\n');

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                background: '#fff',
                padding: '25px',
                position: 'relative',
                fontFamily: OG_FONT_FAMILY.join(','),
            }}
        >
            <Image
                src={OGBackgroundSVG}
                alt="og-background"
                style={{ position: 'absolute', top: 0, left: 0, width: '1200px', height: '630px' }}
                width={1200}
                height={630}
            />

            <div
                style={{
                    position: 'absolute',
                    display: 'flex',
                    top: '91px',
                    left: '80px',
                    padding: '56px',
                    boxSizing: 'content-box',
                    width: '766px',
                    alignItems: src ? 'flex-start' : 'center',
                    flexDirection: 'column',
                    textAlign: src ? 'left' : 'center',
                }}
            >
                {src ? await AttachmentImage({ src }) : null}

                <div style={{ display: 'flex', position: 'relative', width: '120px' }}>
                    <Image
                        src={post.author.pfp}
                        alt="pfp"
                        style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '100%',
                            objectFit: 'cover',
                        }}
                    />
                    <Image
                        src={resolveSourceIcon(post.source)}
                        style={{ width: '32px', height: '32px', position: 'absolute', bottom: 0, right: 0 }}
                        alt="source"
                    />
                </div>
                <div
                    style={{
                        fontSize: '28px',
                        lineHeight: '28px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: src ? '308px' : '100%',
                        paddingTop: '24px',
                        paddingBottom: '6px',
                    }}
                >
                    {post.author.displayName}
                </div>
                <div
                    style={{
                        fontSize: '24px',
                        fontWeight: 400,
                        color: '#767676',
                        paddingTop: '6px',
                        paddingBottom: '20px',
                        lineHeight: '24px',
                    }}
                >
                    {dayjs(post.timestamp).format('hh:mm A · UTC · MMM D YYYY')}
                </div>
                <div
                    style={{
                        display: 'flex',
                        whiteSpace: 'pre-line',
                        wordWrap: 'break-word',
                        height: '116px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontSize: '24px',
                        paddingTop: '20px',
                        lineHeight: '32px',
                        width: '100%',
                        lineClamp: 3,
                    }}
                >
                    {removeCombiningCharacters(content)}
                </div>
            </div>
        </div>
    );
}

const ParamsSchema = z.object({
    postId: z.string().optional(),
    source: SocialSourceSchema,
});

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest, context?: NextRequestContext) => {
    const { postId, source } = await getParamsWithZodSchema(ParamsSchema, context);
    if (!postId || !source) return createProxyImageResponse(urlcat(SITE_URL, '/image/og.png'));

    const post = await resolveSocialMediaProvider(source).getPostById(postId);
    if (!post) return createProxyImageResponse(urlcat(SITE_URL, '/image/og.png'));

    return new ImageResponse(await PostOpenGraphImage({ post }), {
        width: 1200,
        height: 630,
        headers: {
            'Cache-Control': CACHE_AGE_INDEFINITE_ON_DISK,
        },
        fonts: await getSatoriFonts(OG_FONT_FAMILY),
    });
});
