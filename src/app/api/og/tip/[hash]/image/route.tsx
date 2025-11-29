/* eslint-disable @next/next/no-img-element */

import { compose } from '@dimensiondev/utils';
import { ImageResponse } from 'next/og.js';
import type { NextRequest } from 'next/server.js';
import type { HTMLProps } from 'react';
import urlcat from 'urlcat';
import { z } from 'zod';

import { ShrankPrice } from '@/components/ShrankPrice.js';
import { TipsDetailViewType, TipsNotificationType } from '@/constants/enum.js';
import { CACHE_AGE_INDEFINITE_ON_DISK, SITE_URL } from '@/constants/index.js';
import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { fetchAvatarAsBase64 } from '@/helpers/fetchAvatarAsBase64.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { getMaintainAccountInfo } from '@/helpers/getMaintainAccountInfo.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { multipliedBy } from '@/helpers/number.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getTipsTransactionDetail } from '@/providers/firefly/endpoint/getTipsTransactionDetail.js';
import type { TipsDetail } from '@/providers/types/Firefly.js';
import { getSatoriFonts } from '@/services/getSatoriFonts.js';
import type { NextRequestContext } from '@/types/utility.js';

const OG_FALLBACK_AVATAR = urlcat(SITE_URL, '/image/firefly-light-avatar.png');
const ArrowRightTickerbitSVG = urlcat(SITE_URL, '/svg/arrow-right-tickerbit.svg');
const LeftBottomTickerbitSVG = urlcat(SITE_URL, '/svg/left-bottom-tickerbit.svg');
const LeftTopTickerbitSVG = urlcat(SITE_URL, '/svg/left-top-tickerbit.svg');
const RightBottomTickerbitSVG = urlcat(SITE_URL, '/svg/right-bottom-tickerbit.svg');
const RightTopTickerbitSVG = urlcat(SITE_URL, '/svg/right-top-tickerbit.svg');
const TipOGBackgroundSVG = urlcat(SITE_URL, '/svg/tip-og-background.svg');

function breakLines(str: string, maxCharsPerLine = 15, maxLines = 2) {
    if (!str) return '';
    const lines = [];
    for (let i = 0; i < maxLines; i = i + 1) {
        const start = i * maxCharsPerLine;
        const end = start + maxCharsPerLine;
        if (start >= str.length) break;
        lines.push(str.slice(start, end));
    }
    let result = lines.join('\n');
    if (str.length > maxCharsPerLine * maxLines) {
        result = result.slice(0, -1) + '…';
    }
    return result;
}

function Image({ src, ...props }: Pick<HTMLProps<'img'>, 'src' | 'alt' | 'width' | 'height' | 'style'>) {
    return <img alt="img" {...props} src={src} />;
}

async function TipOpenGraphImage({ tip }: { tip: TipsDetail }) {
    const tokenIcon = await fetchAvatarAsBase64(tip.token_icon ?? OG_FALLBACK_AVATAR);

    const accountInfo = getMaintainAccountInfo(tip, TipsDetailViewType.Sender);

    const tokenAmount = Number(tip.amount);
    const tokenSymbol = tip.token_symbol;

    const tokenUSDValue = multipliedBy(tip.token_price, tip.amount);

    const fromAvatar = await fetchAvatarAsBase64(accountInfo?.maintainAccountInfo.avatar ?? OG_FALLBACK_AVATAR);
    const toAvatar = await fetchAvatarAsBase64(accountInfo?.targetAccountInfo.avatar ?? OG_FALLBACK_AVATAR);

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
                        fontFamily: 'Bedstead',
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
                    gap: '12px',
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
                </span>{' '}
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
                            display: 'flex',
                            alignItems: 'center',
                            gap: '24px',
                            background: '#fff',
                            borderRadius: '0',
                            margin: '0 24px',
                            height: '100%',
                        }}
                    >
                        {fromAvatar ? (
                            <Image
                                width={80}
                                height={80}
                                src={fromAvatar}
                                alt={accountInfo?.maintainAccountInfo.displayName}
                                style={{ width: '80px', height: '80px', borderRadius: '999px', objectFit: 'cover' }}
                            />
                        ) : null}
                        <div
                            style={{
                                color: '#171717',
                                maxWidth: '360px',
                                maxHeight: '80px',
                                overflow: 'hidden',
                                whiteSpace: 'pre-line',
                                fontSize: 40,
                                lineHeight: '48px',
                                fontWeight: 500,
                            }}
                        >
                            {breakLines(accountInfo?.maintainAccountInfo.displayName ?? '')}
                        </div>
                        <Image
                            src={ArrowRightTickerbitSVG}
                            alt="arrow-right-tickerbit"
                            width={64}
                            height={64}
                            style={{ width: '64px', height: '64px' }}
                        />
                        {toAvatar ? (
                            <Image
                                width={80}
                                height={80}
                                src={toAvatar}
                                alt={accountInfo?.targetAccountInfo.displayName}
                                style={{ width: '80px', height: '80px', borderRadius: '999px', objectFit: 'cover' }}
                            />
                        ) : null}
                        <div
                            style={{
                                fontSize: 40,
                                lineHeight: '48px',
                                fontWeight: 500,
                                color: '#171717',
                                maxWidth: '360px',
                                maxHeight: '80px',
                                overflow: 'hidden',
                                whiteSpace: 'pre-line',
                            }}
                        >
                            {breakLines(accountInfo?.targetAccountInfo.displayName ?? '')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

async function createTipOpenGraphImageResponse({ tip }: { tip: TipsDetail }) {
    return new ImageResponse(await TipOpenGraphImage({ tip }), {
        width: 1200,
        height: 630,
        fonts: await getSatoriFonts(['Inter', 'NotoSans', 'Bedstead']),
        headers: {
            'Cache-Control': CACHE_AGE_INDEFINITE_ON_DISK,
        },
    });
}

const ParamsSchema = z.object({
    hash: z.string().optional(),
});

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest, context?: NextRequestContext) => {
    const { hash } = await getParamsWithZodSchema(ParamsSchema, context);
    if (!hash) return createProxyImageResponse(urlcat(SITE_URL, '/image/og.png'));

    const tip = await getTipsTransactionDetail(hash, TipsNotificationType.Tip);
    if (!tip) return createProxyImageResponse(urlcat(SITE_URL, '/image/og.png'));

    return createTipOpenGraphImageResponse({ tip });
});
