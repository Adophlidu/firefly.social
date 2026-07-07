/* eslint-disable @next/next/no-img-element */

import { CACHE_AGE_INDEFINITE_ON_DISK } from '@dimensiondev/constants/static';
import { ArticlePlatform } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { formatAddress, isValidAddressEthereum } from '@dimensiondev/web3/utils';
import dayjs from 'dayjs';
import { ImageResponse } from 'next/og.js';
import type { HTMLProps } from 'react';

import { fetchImageAsBase64 } from '@/helpers/fetchAvatarAsBase64.js';
import { getArticleHtmlContent } from '@/helpers/getArticleHtmlContent.js';
import { getImageMetaFromUrl } from '@/helpers/getImageMetaFromUrl.js';
import { getPublicUrl } from '@/helpers/getPublicUrl.js';
import { removeCombiningCharacters } from '@/helpers/removeCombiningCharacters.js';
import type { Article } from '@/providers/types/Article.js';
import { getSatoriFonts } from '@/services/getSatoriFonts.js';

const OG_FONT_FAMILY = ['Inter', 'Noto Sans Symbols 2'];
const CJK_FONT_FAMILY = ['NotoSansSC'];
const CJK_CHARACTER_REGEX = /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u;
const OG_FALLBACK_AVATAR = getPublicUrl('/image/firefly-light-avatar.png');
const OGBackgroundSVG = getPublicUrl('/svg/og-background.svg');
const WalletSVG = getPublicUrl('/svg/eth-circle.svg');

function Image({ src, ...props }: Pick<HTMLProps<'img'>, 'src' | 'alt' | 'width' | 'height' | 'style'>) {
    return <img alt="img" {...props} src={src} />;
}

function getFontPreferences(...texts: string[]) {
    return texts.some((text) => CJK_CHARACTER_REGEX.test(text))
        ? [...CJK_FONT_FAMILY, ...OG_FONT_FAMILY]
        : OG_FONT_FAMILY;
}

function formatPlatformName(platform: ArticlePlatform) {
    switch (platform) {
        case ArticlePlatform.Mirror:
        case ArticlePlatform.Paragraph:
            return 'Paragraph';
        case ArticlePlatform.Limo:
            return 'Limo';
        case ArticlePlatform.Matters:
            return 'Matters';
        default:
            safeUnreachable(platform);
            return 'Article';
    }
}

function formatAuthorName(article: Article) {
    const { handle, displayName, id } = article.author;

    if (handle && !isValidAddressEthereum(handle)) return handle;
    if (displayName && !isValidAddressEthereum(displayName)) return displayName;

    return formatAddress(id, 4);
}

function getArticlePlainText(article: Article) {
    return getArticleHtmlContent(article)
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getArticleExcerpt(article: Article) {
    const plainText = getArticlePlainText(article);
    if (!plainText) return '';

    const title = article.title.trim();
    if (plainText === title) return '';

    return plainText.startsWith(title) ? plainText.slice(title.length).trim() : plainText;
}

async function CoverImage({ src }: { src: string }) {
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
                    alt="cover"
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                />
            </div>
        </div>
    );
}

interface ArticleOpenGraphImageProps {
    article: Article;
    coverUrl?: string | null;
}

async function ArticleOpenGraphImage({ article, coverUrl }: ArticleOpenGraphImageProps) {
    const authorName = formatAuthorName(article);
    const title = article.title.trim();
    const excerpt = getArticleExcerpt(article);
    const subtitle = `${formatPlatformName(article.platform)} · ${dayjs(article.timestamp).format('MMM D YYYY')}`;
    const avatarBase64 = await fetchImageAsBase64(article.author.avatar, OG_FALLBACK_AVATAR);
    const fontFamily = getFontPreferences(title, excerpt, authorName).join(',');

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                background: '#fff',
                padding: '25px',
                position: 'relative',
                fontFamily,
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
                    boxSizing: 'border-box',
                    width: '766px',
                    alignItems: coverUrl ? 'flex-start' : 'center',
                    flexDirection: 'column',
                    textAlign: coverUrl ? 'left' : 'center',
                }}
            >
                {coverUrl ? await CoverImage({ src: coverUrl }) : null}

                <div style={{ display: 'flex', position: 'relative', width: '120px' }}>
                    <Image
                        src={avatarBase64}
                        alt="author"
                        style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '100%',
                            objectFit: 'cover',
                        }}
                    />
                    <Image
                        src={WalletSVG}
                        style={{ width: '32px', height: '32px', position: 'absolute', bottom: 0, right: 0 }}
                        alt="wallet"
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
                        maxWidth: coverUrl ? '308px' : '100%',
                        paddingTop: '24px',
                        paddingBottom: '6px',
                    }}
                >
                    {authorName}
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
                    {subtitle}
                </div>

                <div
                    style={{
                        display: 'flex',
                        fontSize: '32px',
                        lineHeight: '40px',
                        fontWeight: 700,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                        lineClamp: 2,
                        paddingBottom: excerpt ? '16px' : '0',
                    }}
                >
                    {removeCombiningCharacters(title)}
                </div>

                {excerpt ? (
                    <div
                        style={{
                            display: 'flex',
                            whiteSpace: 'pre-line',
                            wordWrap: 'break-word',
                            height: '96px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '24px',
                            lineHeight: '32px',
                            width: '100%',
                            lineClamp: 3,
                            color: '#07101B',
                        }}
                    >
                        {removeCombiningCharacters(excerpt)}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export async function createArticleOpenGraphImageResponse(props: ArticleOpenGraphImageProps) {
    const { article, coverUrl } = props;
    const authorName = formatAuthorName(article);
    const title = article.title.trim();
    const excerpt = getArticleExcerpt(article);

    return new ImageResponse(await ArticleOpenGraphImage(props), {
        width: 1200,
        height: 630,
        fonts: await getSatoriFonts(getFontPreferences(title, excerpt, authorName)),
        headers: {
            'Cache-Control': CACHE_AGE_INDEFINITE_ON_DISK,
        },
    });
}
