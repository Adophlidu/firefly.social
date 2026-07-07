/* eslint-disable @next/next/no-img-element */

import { CACHE_AGE_INDEFINITE_ON_DISK } from '@dimensiondev/constants/static';
import { getChainIcon } from '@dimensiondev/web3/chains';
import type { CoinGeckoToken } from '@dimensiondev/workers-token';
import { ImageResponse } from 'next/og.js';
import type { HTMLProps } from 'react';

import { fetchImageAsBase64FromUrls } from '@/helpers/fetchAvatarAsBase64.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { getPublicUrl } from '@/helpers/getPublicUrl.js';
import { resolveTokenLogoURL } from '@/helpers/resolveTokenLogoURL.js';
import { getSatoriFonts } from '@/services/getSatoriFonts.js';

const OG_FALLBACK_AVATAR = getPublicUrl('/image/firefly-light-avatar.png');
const OG_BACKGROUND = getPublicUrl('/image/profile-og-background.png');
const OG_AVATAR_SIZE = 284;
const BASE_FONT_FAMILY = ['Bedstead'];
const CJK_FONT_FAMILY = ['NotoSansSC'];
const CJK_CHARACTER_REGEX = /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u;

function Image({ src, ...props }: Pick<HTMLProps<'img'>, 'src' | 'alt' | 'width' | 'height' | 'style'>) {
    return <img alt="img" {...props} src={src} />;
}

function getFontPreferences(text: string): string[] {
    return CJK_CHARACTER_REGEX.test(text) ? [...CJK_FONT_FAMILY, ...BASE_FONT_FAMILY] : BASE_FONT_FAMILY;
}

function formatTokenDisplayName(token: CoinGeckoToken) {
    return `$${token.symbol.toUpperCase()}`;
}

function formatTokenSubtitle(token: CoinGeckoToken) {
    const parts = [token.name];

    if (token.price !== undefined && !Number.isNaN(token.price)) {
        parts.push(`$${formatPrice(token.price)}`);
    }

    return parts.join(' · ');
}

function resolveChainIconUrl(chainId?: number) {
    const icon = getChainIcon(chainId);
    return icon ? getPublicUrl(icon) : undefined;
}

function resolveTokenLogoCandidates(token: CoinGeckoToken, chainId?: number) {
    const resolvedChainId = chainId ?? token.chainId;
    const address = token.address;

    return [token.logoURL, resolvedChainId && address ? resolveTokenLogoURL(resolvedChainId, address) : undefined];
}

interface TokenOpenGraphImageProps {
    token: CoinGeckoToken;
    chainId?: number;
}

async function TokenOpenGraphImage({ token, chainId }: TokenOpenGraphImageProps) {
    const displayName = formatTokenDisplayName(token);
    const subtitle = formatTokenSubtitle(token);
    const avatarBase64 = await fetchImageAsBase64FromUrls(
        resolveTokenLogoCandidates(token, chainId),
        OG_FALLBACK_AVATAR,
    );
    const chainIconUrl = resolveChainIconUrl(chainId ?? token.chainId);
    const chainIconBase64 = chainIconUrl ? await fetchImageAsBase64FromUrls([chainIconUrl], OG_FALLBACK_AVATAR) : null;
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
                        alt="og-token"
                        style={{
                            width: `${OG_AVATAR_SIZE}px`,
                            height: `${OG_AVATAR_SIZE}px`,
                            borderRadius: '200px',
                            objectFit: 'cover',
                        }}
                        width={OG_AVATAR_SIZE}
                        height={OG_AVATAR_SIZE}
                    />
                    {chainIconBase64 ? (
                        <Image
                            src={chainIconBase64}
                            alt="chain"
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

export async function createTokenOpenGraphImageResponse(props: TokenOpenGraphImageProps) {
    const displayName = formatTokenDisplayName(props.token);
    const subtitle = formatTokenSubtitle(props.token);

    return new ImageResponse(await TokenOpenGraphImage(props), {
        width: 1200,
        height: 630,
        fonts: await getSatoriFonts([
            ...new Set([...getFontPreferences(displayName), ...getFontPreferences(subtitle)]),
        ]),
        headers: {
            'Cache-Control': CACHE_AGE_INDEFINITE_ON_DISK,
        },
    });
}
