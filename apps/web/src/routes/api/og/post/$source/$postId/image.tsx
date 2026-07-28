/* eslint-disable @next/next/no-img-element */

import { CACHE_AGE_INDEFINITE_ON_DISK } from '@dimensiondev/constants/static';
import { AttachmentType, type SocialSource, Source } from '@dimensiondev/enums';
import type { NextRequestContext } from '@dimensiondev/types';
import { compose, safeUnreachable } from '@dimensiondev/utils';
import dayjs from 'dayjs';
import type { ApiContext } from '@dimensiondev/ssr';
import type { NextRequest } from '@/compat/next-server.js';
import type { HTMLProps } from 'react';
import { z } from 'zod';

import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { fetchImageAsBase64 } from '@/helpers/fetchAvatarAsBase64.js';
import { getDefaultOgImageUrl } from '@/helpers/getDefaultOgImageUrl.js';
import { getImageMetaFromUrl } from '@/helpers/getImageMetaFromUrl.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { getPublicUrl } from '@/helpers/getPublicUrl.js';
import { getSharerHandle } from '@/helpers/getSharerHandle.js';
import { removeCombiningCharacters } from '@/helpers/removeCombiningCharacters.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import type { Attachment, Post } from '@/providers/types/SocialMedia.js';
import { SocialSourceSchema } from '@/schemas/Source.js';
import { getSatoriFonts } from '@/services/getSatoriFonts.js';
import { createOgImageResponse } from '@/services/og/createOgImageResponse.js';

const OG_FONT_FAMILY = ['Inter', 'Noto Sans Symbols 2'];
const OG_FALLBACK_AVATAR = getPublicUrl('/image/firefly-light-avatar.png');

interface OgEnv {
    ASSETS: { fetch(input: Request): Promise<Response> };
}

async function loadSvgDataUri(assets: OgEnv['ASSETS'], path: string): Promise<string> {
    const response = await assets.fetch(new Request(`https://assets.local${path}`));
    const text = await response.text();
    let binary = '';
    for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
    return `data:image/svg+xml;base64,${btoa(binary)}`;
}

async function loadImageDataUri(assets: OgEnv['ASSETS'], path: string, mime: string): Promise<string> {
    const response = await assets.fetch(new Request(`https://assets.local${path}`));
    const buffer = new Uint8Array(await response.arrayBuffer());
    let binary = '';
    for (const byte of buffer) binary += String.fromCharCode(byte);
    return `data:${mime};base64,${btoa(binary)}`;
}

async function loadPostOgImages(assets: OgEnv['ASSETS']) {
    const [background, sharerBackground, bsky, farcaster, lens, twitter, fallbackAvatar] = await Promise.all([
        loadSvgDataUri(assets, '/svg/og-background.svg'),
        loadSvgDataUri(assets, '/svg/sharer-background.svg'),
        loadSvgDataUri(assets, '/svg/bsky-circle.svg'),
        loadSvgDataUri(assets, '/svg/farcaster.svg'),
        loadSvgDataUri(assets, '/svg/lens.svg'),
        loadSvgDataUri(assets, '/svg/x-circle-light.svg'),
        loadImageDataUri(assets, '/image/firefly-light-avatar.png', 'image/png'),
    ]);
    return { background, sharerBackground, bsky, farcaster, lens, twitter, fallbackAvatar };
}

const BskySVG = getPublicUrl('/svg/bsky-circle.svg');
const FarcasterSVG = getPublicUrl('/svg/farcaster.svg');
const LensSVG = getPublicUrl('/svg/lens.svg');
const OGBackgroundSVG = getPublicUrl('/svg/og-background.svg');
const TwitterSVG = getPublicUrl('/svg/x-circle-light.svg');
const SharerBackgroundSVG = getPublicUrl('/svg/sharer-background.svg');

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
        case AttachmentType.Image:
            return asset.uri;
        case AttachmentType.Video:
        case AttachmentType.AnimatedGif:
            return asset.coverUri;
        case AttachmentType.Audio:
        case AttachmentType.Poll:
        case AttachmentType.Unknown:
            return null;
        default:
            safeUnreachable(asset.type);
            return null;
    }
}

function getCompactImageSize(width: number, height: number) {
    const aspectRatio = width / height;

    if (aspectRatio > 1.2) {
        const maxWidth = 364;
        const maxHeight = 273;
        const scale = Math.min(maxWidth / width, maxHeight / height);
        return {
            width: Math.round(width * scale),
            height: Math.round(height * scale),
            maxWidth,
            maxHeight,
        };
    }

    if (aspectRatio < 0.8) {
        const maxWidth = 252;
        const maxHeight = 336;
        const scale = Math.min(maxWidth / width, maxHeight / height);
        return {
            width: Math.round(width * scale),
            height: Math.round(height * scale),
            maxWidth,
            maxHeight,
        };
    }

    const maxSize = 252;
    const scale = Math.max(width, height) === 0 ? 1 : maxSize / Math.max(width, height);
    return {
        width: Math.round(width * scale),
        height: Math.round(height * scale),
        maxWidth: maxSize,
        maxHeight: maxSize,
    };
}

function Image({ src, ...props }: Pick<HTMLProps<'img'>, 'src' | 'alt' | 'width' | 'height' | 'style'>) {
    return <img alt="img" {...props} src={src} />;
}

async function AttachmentImage({ src }: { src: string }) {
    const [imageMeta, base64] = await Promise.all([getImageMetaFromUrl(src), fetchImageAsBase64(src)]);
    if (!imageMeta || !base64) return null;

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
                    src={base64}
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

async function CompactAttachmentImage({ src }: { src: string }) {
    const [imageMeta, base64] = await Promise.all([getImageMetaFromUrl(src), fetchImageAsBase64(src)]);
    if (!imageMeta || !base64) return null;

    const { width, height } = imageMeta;
    const { width: scaledWidth, height: scaledHeight, maxWidth, maxHeight } = getCompactImageSize(width, height);

    return (
        <div
            style={{
                display: 'flex',
                position: 'absolute',
                top: '-40px',
                right: '56px',
                width: `${maxWidth}px`,
                height: `${maxHeight}px`,
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
                    src={base64}
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

async function PostOpenGraphImage({
    post,
    sharerHandle,
    images,
}: {
    post: Post;
    sharerHandle?: string | null;
    images: Awaited<ReturnType<typeof loadPostOgImages>>;
}) {
    const OGBackgroundSVG = images.background;
    const SharerBackgroundSVG = images.sharerBackground;
    const BskySVG = images.bsky;
    const FarcasterSVG = images.farcaster;
    const LensSVG = images.lens;
    const TwitterSVG = images.twitter;
    const src = resolveAttachmentsSrc(post.metadata.content?.asset);
    const content = (post.metadata.content?.content ?? '')
        .split('\n')
        .map((x) => x.trim())
        .join('\n');

    const originalContent = post.metadata.content?.content ?? '';
    const isCompactLayout = originalContent.length < 50;

    const avatarBase64 = await fetchImageAsBase64(post.author.pfp, images.fallbackAvatar);

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

            {sharerHandle ? (
                <div
                    style={{
                        display: 'flex',
                        position: 'absolute',
                        top: '67px',
                        left: '78px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '48px',
                        paddingLeft: '24px',
                        paddingRight: '24px',
                        backgroundImage: `url(${SharerBackgroundSVG})`,
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    <div
                        style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            color: '#ffffff',
                            fontFamily: OG_FONT_FAMILY.join(','),
                            display: 'flex',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Shared by @{sharerHandle}
                    </div>
                </div>
            ) : null}

            {isCompactLayout ? (
                <div
                    style={{
                        position: 'absolute',
                        display: 'flex',
                        top: '91px',
                        left: '80px',
                        width: '766px',
                        height: '456px',
                        alignItems: 'flex-end',
                        flexDirection: 'column',
                        textAlign: 'left',
                        justifyContent: 'flex-end',
                        padding: '56px',
                        boxSizing: 'border-box',
                    }}
                >
                    {src ? await CompactAttachmentImage({ src }) : null}

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '24px',
                            width: '100%',
                        }}
                    >
                        <div style={{ display: 'flex', position: 'relative', width: '120px' }}>
                            <Image
                                src={avatarBase64}
                                alt="pfp"
                                width={120}
                                height={120}
                                style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                            <Image
                                src={resolveSourceIcon(post.source)}
                                width={32}
                                height={32}
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
                                maxWidth: '100%',
                            }}
                        >
                            {post.author.displayName}
                        </div>
                        <div
                            style={{
                                fontSize: '24px',
                                fontWeight: 400,
                                color: '#767676',
                                lineHeight: '24px',
                            }}
                        >
                            {dayjs(post.timestamp).format('hh:mm A · UTC · MMM D YYYY')}
                        </div>
                        {content ? (
                            <div
                                style={{
                                    display: 'flex',
                                    whiteSpace: 'pre-line',
                                    wordWrap: 'break-word',
                                    fontSize: '24px',
                                    lineHeight: '32px',
                                    width: '100%',
                                }}
                            >
                                {removeCombiningCharacters(content)}
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        position: 'absolute',
                        display: 'flex',
                        top: '91px',
                        left: '80px',
                        padding: '56px',
                        boxSizing: 'border-box',
                        width: '766px',
                        alignItems: src ? 'flex-start' : 'center',
                        flexDirection: 'column',
                        textAlign: src ? 'left' : 'center',
                    }}
                >
                    {src ? await AttachmentImage({ src }) : null}

                    <div style={{ display: 'flex', position: 'relative', width: '120px' }}>
                        <Image
                            src={avatarBase64}
                            alt="pfp"
                            width={120}
                            height={120}
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '100%',
                                objectFit: 'cover',
                            }}
                        />
                        <Image
                            src={resolveSourceIcon(post.source)}
                            width={32}
                            height={32}
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
            )}
        </div>
    );
}

const ParamsSchema = z.object({
    postId: z.string().optional(),
    source: SocialSourceSchema,
});

const getHandler = async (request: NextRequest, context?: NextRequestContext, env?: OgEnv) => {
    const { postId, source } = await getParamsWithZodSchema(ParamsSchema, context);
    if (!postId || !source)
        return createProxyImageResponse(getDefaultOgImageUrl(), (path) =>
            env!.ASSETS.fetch(new Request(new URL(path, request.url))),
        );

    const post = await resolveSocialMediaProvider(source).getPostById(postId);
    if (!post)
        return createProxyImageResponse(getDefaultOgImageUrl(), (path) =>
            env!.ASSETS.fetch(new Request(new URL(path, request.url))),
        );

    const sharerHandle = await getSharerHandle(new URL(request.url).searchParams.get('sid'));
    const images = await loadPostOgImages(env!.ASSETS);

    return createOgImageResponse(await PostOpenGraphImage({ post, sharerHandle, images }), {
        width: 1200,
        height: 630,
        fonts: await getSatoriFonts(OG_FONT_FAMILY, undefined, new URL(request.url).origin, (url) =>
            env!.ASSETS.fetch(new Request(url)).then((response: Response) => response.arrayBuffer()),
        ),
        cacheControl: CACHE_AGE_INDEFINITE_ON_DISK as string,
    });
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
