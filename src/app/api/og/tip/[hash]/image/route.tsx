/* eslint-disable @next/next/no-img-element */

import { ImageResponse } from 'next/og.js';
import type { NextRequest } from 'next/server.js';
import type { HTMLProps } from 'react';
import urlcat from 'urlcat';

import ArrowRightTickerbitSVG from '@/assets/arrow-right-tickerbit.svg?url';
import LeftBottomTickerbitSVG from '@/assets/left-bottom-tickerbit.svg?url';
import LeftTopTickerbitSVG from '@/assets/left-top-tickerbit.svg?url';
import RightBottomTickerbitSVG from '@/assets/right-bottom-tickerbit.svg?url';
import RightTopTickerbitSVG from '@/assets/right-top-tickerbit.svg?url';
import TipOGBackgroundSVG from '@/assets/tip-og-background.svg?url';
import { ShrankPrice } from '@/components/ShrankPrice.js';
import { getMaintainAccountInfo } from '@/components/Tips/TipsDetail.js';
import { TipsDetailViewType, TipsNotificationType } from '@/constants/enum.js';
import { CACHE_AGE_INDEFINITE_ON_DISK, SITE_URL } from '@/constants/index.js';
import { compose } from '@/helpers/compose.js';
import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { fetchArrayBuffer } from '@/helpers/fetchArrayBuffer.js';
import { fetchAvatarAsBase64 } from '@/helpers/fetchAvatarAsBase64.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { multipliedBy } from '@/helpers/number.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { TipsDetail } from '@/providers/types/Firefly.js';
import { getSatoriFonts } from '@/services/getSatoriFonts.js';
import type { NextRequestContext } from '@/types/index.js';

const OG_FONT_FAMILY = '"Inter", "NotoSans"';
const OG_FALLBACK_AVATAR = urlcat(SITE_URL, '/image/firefly-light-avatar.png');

function Image({ src, ...props }: Pick<HTMLProps<'img'>, 'src' | 'alt' | 'width' | 'height' | 'style'>) {
    return <img alt="img" {...props} src={src} />;
}

async function TipOpenGraphImage({
    tip,
    view = TipsDetailViewType.Sender,
}: {
    tip: TipsDetail;
    view?: TipsDetailViewType;
}) {
    const tokenIcon = await fetchAvatarAsBase64(tip.token_icon ?? OG_FALLBACK_AVATAR);

    const accountInfo = getMaintainAccountInfo(tip, view);

    const tokenAmount = Number(tip.amount);
    const tokenSymbol = tip.token_symbol;

    const tokenUSDValue = multipliedBy(tip.token_price, tip.amount);

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
                src={TipOGBackgroundSVG}
                alt="tip-og-background"
                width={1200}
                height={630}
                style={{ position: 'absolute', top: 0, left: 0, width: '1200px', height: '630px', objectFit: 'cover' }}
            />

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    top: 158,
                    width: '100%',
                }}
            >
                <span
                    style={{
                        fontSize: 144,
                        lineHeight: '144px',
                        fontFamily: 'Tickerbit',
                        fontWeight: 700,
                        color: '#fff',
                    }}
                >
                    $
                    {tokenUSDValue.isGreaterThan(0.01)
                        ? renderShrankPrice(formatPrice(tokenUSDValue.toString()) || '')
                        : ''}
                </span>
            </div>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    top: 302,
                    width: '100%',
                }}
            >
                {tokenIcon ? (
                    <Image
                        alt={tokenSymbol}
                        src={tokenIcon}
                        width={48}
                        height={48}
                        style={{ width: '48px', height: '48px', borderRadius: '999px' }}
                    />
                ) : null}
                <span style={{ fontSize: 48, lineHeight: '48px', fontWeight: 500, color: '#fff' }}>
                    {tokenAmount > 1 ? (
                        tokenAmount.toFixed(2)
                    ) : tokenAmount < 0.0001 ? (
                        <ShrankPrice shrank={formatPrice(tokenAmount) ?? ''} />
                    ) : (
                        tokenAmount.toFixed(4).replace(/\.?0+$/, '')
                    )}
                </span>
                <span style={{ fontSize: 48, lineHeight: '48px', fontWeight: 500, color: '#fff' }}>{tokenSymbol}</span>
            </div>
            <div
                style={{
                    position: 'absolute',
                    bottom: 96,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    height: '136px',
                }}
            >
                <div
                    style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        height: '136px',
                        gap: '24px',

                        boxSizing: 'border-box',
                    }}
                >
                    <Image
                        src={LeftTopTickerbitSVG}
                        alt="left-top-corner"
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '24px',
                            height: '24px',
                            zIndex: 2,
                        }}
                    />
                    <Image
                        src={RightTopTickerbitSVG}
                        alt="right-top-corner"
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            width: '24px',
                            height: '24px',
                            zIndex: 2,
                        }}
                    />
                    <Image
                        src={LeftBottomTickerbitSVG}
                        alt="left-bottom-corner"
                        style={{
                            position: 'absolute',
                            left: 0,
                            bottom: 0,
                            width: '24px',
                            height: '24px',
                            zIndex: 2,
                        }}
                    />
                    <Image
                        src={RightBottomTickerbitSVG}
                        alt="right-bottom-corner"
                        style={{
                            position: 'absolute',
                            right: 0,
                            bottom: 0,
                            width: '24px',
                            height: '24px',
                            zIndex: 2,
                        }}
                    />

                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 22,
                            width: '24px',
                            height: '92px',
                            background: '#fff',
                            display: 'flex',
                        }}
                    />

                    <div
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 22,
                            width: '24px',
                            height: '92px',
                            background: '#fff',
                            display: 'flex',
                        }}
                    />

                    <div
                        style={{
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '24px',
                            background: '#fff',
                            borderRadius: '0',
                            margin: '0 24px',
                            height: '100%',
                        }}
                    >
                        <Image
                            width={80}
                            height={80}
                            src={accountInfo?.maintainAccountInfo.avatar}
                            alt={accountInfo?.maintainAccountInfo.displayName}
                            style={{ width: '80px', height: '80px', borderRadius: '999px' }}
                        />
                        <div
                            style={{
                                fontSize: 40,
                                lineHeight: '40px',
                                fontWeight: 500,
                                color: '#171717',
                                maxWidth: '360px',
                                overflow: 'hidden',
                                display: 'flex',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {accountInfo?.maintainAccountInfo.displayName}
                        </div>
                        <Image
                            src={ArrowRightTickerbitSVG}
                            alt="arrow-right-tickerbit"
                            width={64}
                            height={64}
                            style={{ width: '64px', height: '64px' }}
                        />
                        <Image
                            width={80}
                            height={80}
                            src={accountInfo?.targetAccountInfo.avatar}
                            alt={accountInfo?.targetAccountInfo.displayName}
                            style={{ width: '80px', height: '80px', borderRadius: '999px' }}
                        />
                        <div
                            style={{
                                fontSize: 40,
                                lineHeight: '40px',
                                fontWeight: 500,
                                color: '#171717',
                                maxWidth: '360px',
                                overflow: 'hidden',
                                display: 'flex',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {accountInfo?.targetAccountInfo.displayName}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

async function createTipOpenGraphImageResponse({ tip, view }: { tip: TipsDetail; view?: TipsDetailViewType }) {
    return new ImageResponse(await TipOpenGraphImage({ tip, view }), {
        width: 1200,
        height: 630,
        fonts: [
            ...(await getSatoriFonts()),
            {
                name: 'Tickerbit',
                data: await fetchArrayBuffer(urlcat(SITE_URL, '/font/Tickerbit-Regular.otf')),
                style: 'normal',
            },
        ],
        headers: {
            'Cache-Control': CACHE_AGE_INDEFINITE_ON_DISK,
        },
    });
}

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest, context?: NextRequestContext) => {
    const params = await context?.params;
    if (!params?.hash) return createProxyImageResponse(urlcat(SITE_URL, '/image/og.png'));

    const searchParams = new URL(request.url).searchParams;
    const view = (searchParams.get('view') as TipsDetailViewType) || TipsDetailViewType.Sender;

    const tipData = await FireflyEndpointProvider.getTipsTransactionDetail(params.hash, TipsNotificationType.Tip);

    if (!tipData) return createProxyImageResponse(urlcat(SITE_URL, '/image/og.png'));

    return createTipOpenGraphImageResponse({ tip: tipData, view });
});
