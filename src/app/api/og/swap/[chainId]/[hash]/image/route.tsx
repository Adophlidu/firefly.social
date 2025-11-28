/* eslint-disable @next/next/no-img-element */

import { compose } from '@dimensiondev/utils';
import { first } from 'lodash-es';
import { ImageResponse } from 'next/og.js';
import type { NextRequest } from 'next/server.js';
import type { HTMLProps } from 'react';
import urlcat from 'urlcat';

import { ShrankPrice } from '@/components/ShrankPrice.js';
import { Source } from '@/constants/enum.js';
import { CACHE_AGE_INDEFINITE_ON_DISK, SITE_URL } from '@/constants/index.js';
import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { fetchAvatarAsBase64 } from '@/helpers/fetchAvatarAsBase64.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { resolveChainIcon } from '@/helpers/resolveChainIcon.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getSwapActivityByHash } from '@/providers/firefly/endpoint/getSwapActivityByHash.js';
import type { SwapActivity } from '@/providers/types/Firefly.js';
import { getSatoriFonts } from '@/services/getSatoriFonts.js';
import type { NextRequestContext } from '@/types/utility.js';

const OG_FONT_FAMILY = '"Inter", "NotoSans"';
const OG_FALLBACK_AVATAR = urlcat(SITE_URL, '/image/firefly-light-avatar.png');
const BRIDGE_OG_BACKGROUND_SVG = urlcat(SITE_URL, '/image/bridge-og-background.svg');
const COPY_TRADE_BUTTON_SVG = urlcat(SITE_URL, '/image/copy-trade-button.svg');
const SWAP_OG_BACKGROUND_SVG = urlcat(SITE_URL, '/image/swap-og-background.svg');

function Image({ src, ...props }: Pick<HTMLProps<'img'>, 'src' | 'alt' | 'width' | 'height' | 'style'>) {
    return <img alt="img" {...props} src={src} />;
}

async function SwapOpenGraphImage({ swap }: { swap: SwapActivity }) {
    const fromToken = await fetchAvatarAsBase64(swap.from_token?.logo || OG_FALLBACK_AVATAR);
    const toToken = await fetchAvatarAsBase64(swap.to_token?.logo || OG_FALLBACK_AVATAR);

    const chainIconUrl = resolveChainIcon(swap.chain_id);
    const chainIcon = chainIconUrl ? await fetchAvatarAsBase64(chainIconUrl) : null;

    const toChainIconUrl = swap.to_chain_id ? resolveChainIcon(swap.to_chain_id) : null;
    const toChainIcon = toChainIconUrl ? await fetchAvatarAsBase64(toChainIconUrl) : null;

    const fromTokenAmountNum = Number(swap.from_token?.amount_num);
    const toTokenAmountNum = Number(swap.to_token?.amount_num);

    const avatarUrl = swap.displayInfo?.avatarUrl || getStampAvatarByProfileId(Source.Wallet, swap.owner);
    const avatar = avatarUrl ? await fetchAvatarAsBase64(avatarUrl) : null;

    // Use absolute paths for SVG files
    const backgroundImageUrl = swap.is_cross_chain ? BRIDGE_OG_BACKGROUND_SVG : SWAP_OG_BACKGROUND_SVG;

    const copyTradeButtonImageUrl = COPY_TRADE_BUTTON_SVG;

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                position: 'relative',
            }}
        >
            <Image
                src={backgroundImageUrl}
                alt="swap-og-background"
                width={1200}
                height={630}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '1200px',
                    height: '630px',
                    objectFit: 'cover',
                }}
            />
            <div style={{ display: 'flex', position: 'absolute', top: '200px', left: '312px' }}>
                {fromToken ? (
                    <Image
                        src={fromToken}
                        alt="from-token"
                        width={128}
                        height={128}
                        style={{ borderRadius: '999px' }}
                    />
                ) : (
                    <div
                        style={{
                            width: '128px',
                            height: '128px',
                            borderRadius: '999px',
                            border: '1px solid #000000',
                        }}
                    >
                        {first(swap.from_token?.symbol)}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', position: 'absolute', top: '288px', left: '400px' }}>
                {chainIcon ? (
                    <Image src={chainIcon} alt="chain-icon" width={48} height={48} style={{ borderRadius: '12px' }} />
                ) : null}
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: '8px',
                    position: 'absolute',
                    top: '350px',
                    left: '156px',
                    alignItems: 'center',
                    fontWeight: '900',
                    fontFamily: OG_FONT_FAMILY,
                    color: '#171717',
                    fontSize: '40px',
                    lineHeight: '40px',
                    width: '440px',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                <span>-</span>
                <span>
                    {fromTokenAmountNum > 1 ? (
                        nFormatter(fromTokenAmountNum).toUpperCase()
                    ) : fromTokenAmountNum < 0.0001 ? (
                        <ShrankPrice shrank={formatPrice(fromTokenAmountNum) ?? ''} />
                    ) : (
                        fromTokenAmountNum.toFixed(4).replace(/\.?0+$/, '')
                    )}
                </span>
                <span>{swap.from_token?.symbol}</span>
            </div>

            <div style={{ display: 'flex', position: 'absolute', top: '200px', right: '312px' }}>
                {toToken ? (
                    <Image src={toToken} alt="to-token" width={128} height={128} style={{ borderRadius: '999px' }} />
                ) : (
                    <div
                        style={{ width: '128px', height: '128px', borderRadius: '999px', border: '1px solid #000000' }}
                    >
                        {first(swap.to_token?.symbol)}
                    </div>
                )}
            </div>

            <div style={{ right: 300, top: 288, display: 'flex', position: 'absolute' }}>
                {toChainIcon ? (
                    <Image
                        src={toChainIcon}
                        alt="to-chain-icon"
                        width={48}
                        height={48}
                        style={{ borderRadius: '12px' }}
                    />
                ) : chainIcon ? (
                    <Image src={chainIcon} alt="chain-icon" width={48} height={48} style={{ borderRadius: '12px' }} />
                ) : null}
            </div>

            <div
                style={{
                    display: 'flex',
                    position: 'absolute',
                    top: '350px',
                    right: '156px',
                    alignItems: 'flex-end',
                    fontWeight: '900',
                    fontFamily: OG_FONT_FAMILY,
                    color: '#429F37',
                    fontSize: '40px',
                    lineHeight: '40px',
                    width: '440px',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    gap: '8px',
                }}
            >
                <span>+</span>
                <span>
                    {toTokenAmountNum > 1 ? (
                        nFormatter(toTokenAmountNum).toUpperCase()
                    ) : toTokenAmountNum < 0.0001 ? (
                        <ShrankPrice shrank={formatPrice(toTokenAmountNum) ?? ''} />
                    ) : (
                        toTokenAmountNum.toFixed(4).replace(/\.?0+$/, '')
                    )}
                </span>
                <span>{swap.to_token?.symbol}</span>
            </div>

            <div
                style={{
                    display: 'flex',
                    position: 'absolute',
                    top: '468px',
                    left: '78px',
                    gap: '12px',
                    alignItems: 'center',
                    fontWeight: '700',
                    fontFamily: OG_FONT_FAMILY,
                    color: '#171717',
                    fontSize: '40px',
                    lineHeight: '40px',
                }}
            >
                {avatar ? (
                    <Image src={avatar} alt="avatar" width={88} height={88} style={{ borderRadius: '999px' }} />
                ) : null}
                <span>
                    {' '}
                    {swap.displayInfo?.fireflyName ||
                        (swap.displayInfo?.ensHandle ? (
                            <span>
                                {swap.displayInfo.ensHandle.split('.')[0]}
                                <span className="text-second">.{swap.displayInfo.ensHandle.split('.')[1]}</span>
                            </span>
                        ) : (
                            formatAddress(swap.owner, 4)
                        ))}
                </span>
            </div>

            <div style={{ display: 'flex', position: 'absolute', top: '498px', right: '64px' }}>
                <Image src={copyTradeButtonImageUrl} alt="copy-trade-button" width={272} height={48} />
            </div>
        </div>
    );
}

async function createSwapOpenGraphImageResponse({ swap }: { swap: SwapActivity }) {
    return new ImageResponse(await SwapOpenGraphImage({ swap }), {
        width: 1200,
        height: 630,
        fonts: await getSatoriFonts(['Inter', 'NotoSans']),
        headers: {
            'Cache-Control': CACHE_AGE_INDEFINITE_ON_DISK,
        },
    });
}

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest, context?: NextRequestContext) => {
    const params = await context?.params;
    if (!params?.hash || !params?.chainId) return createProxyImageResponse(urlcat(SITE_URL, '/image/og.png'));

    const activity = await getSwapActivityByHash(params.hash, Number(params.chainId));
    if (!activity) return createProxyImageResponse(urlcat(SITE_URL, '/image/og.png'));

    return createSwapOpenGraphImageResponse({ swap: activity });
});
