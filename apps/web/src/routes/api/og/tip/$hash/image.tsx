/* eslint-disable @next/next/no-img-element */

import { CACHE_AGE_INDEFINITE_ON_DISK } from '@dimensiondev/constants/static';
import { Source, TipsDetailViewType, TipsNotificationType } from '@dimensiondev/enums';
import type { ApiContext } from '@dimensiondev/ssr';
import type { NextRequestContext } from '@dimensiondev/types';
import { multipliedBy } from '@dimensiondev/web3/numbers';
import type { HTMLProps } from 'react';
import { z } from 'zod';

import type { NextRequest } from '@/compat/next-server.js';
import { ShrankPrice } from '@/components/ShrankPrice.js';
import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { fetchImageAsBase64, fetchImageAsBase64FromUrls } from '@/helpers/fetchAvatarAsBase64.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { getDefaultOgImageUrl } from '@/helpers/getDefaultOgImageUrl.js';
import { getMaintainAccountInfo } from '@/helpers/getMaintainAccountInfo.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getTipsTransactionDetail } from '@/providers/firefly/endpoint/getTipsTransactionDetail.js';
import type { TipsDetail } from '@/providers/types/Firefly.js';
import { createOgImageResponse } from '@/services/og/createOgImageResponse.js';
import { getOgSatoriFonts, loadImageDataUri, loadSvgDataUri, type OgAssets } from '@/services/og/loadOgAsset.js';

interface OgEnv {
    ASSETS: OgAssets;
}

async function loadTipOgImages(assets: OgAssets) {
    const [background, arrowRight, leftBottom, leftTop, rightBottom, rightTop, fallbackAvatar] = await Promise.all([
        loadSvgDataUri(assets, '/svg/tip-og-background.svg'),
        loadSvgDataUri(assets, '/svg/arrow-right-tickerbit.svg'),
        loadSvgDataUri(assets, '/svg/left-bottom-tickerbit.svg'),
        loadSvgDataUri(assets, '/svg/left-top-tickerbit.svg'),
        loadSvgDataUri(assets, '/svg/right-bottom-tickerbit.svg'),
        loadSvgDataUri(assets, '/svg/right-top-tickerbit.svg'),
        loadImageDataUri(assets, '/image/firefly-light-avatar.png'),
    ]);
    return { background, arrowRight, leftBottom, leftTop, rightBottom, rightTop, fallbackAvatar };
}

type TipOgImages = Awaited<ReturnType<typeof loadTipOgImages>>;

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

async function fetchAvatarImageAsBase64(
    info: { avatar?: string; fireflyUid?: string } | undefined,
    fallbackAvatar: string,
) {
    return fetchImageAsBase64FromUrls(
        [info?.avatar, info?.fireflyUid ? getStampAvatarByProfileId(Source.Firefly, info.fireflyUid) : undefined],
        fallbackAvatar,
    );
}

async function TipOpenGraphImage({ tip, images }: { tip: TipsDetail; images: TipOgImages }) {
    const tokenIcon = await fetchImageAsBase64(tip.token_icon, images.fallbackAvatar);
    const tokenAmount = Number(tip.amount);
    const tokenSymbol = tip.token_symbol;
    const tokenUSDValue = multipliedBy(tip.token_price, tip.amount);

    const accountInfo = getMaintainAccountInfo(tip, TipsDetailViewType.Sender);
    const fromAvatar = await fetchAvatarImageAsBase64(accountInfo?.maintainAccountInfo, images.fallbackAvatar);
    const toAvatar = await fetchAvatarImageAsBase64(accountInfo?.targetAccountInfo, images.fallbackAvatar);

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
                src={images.background}
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
                    {tokenUSDValue.isGreaterThan(1)
                        ? tokenUSDValue.toFixed(2)
                        : tokenUSDValue.isGreaterThan(0.01)
                          ? tokenUSDValue.toFixed(4).replace(/\.?0+$/, '')
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
                        src={images.leftTop}
                        alt="left-top-corner"
                        width={24}
                        height={24}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '24px',
                            height: '24px',
                        }}
                    />
                    <Image
                        src={images.rightTop}
                        alt="right-top-corner"
                        width={24}
                        height={24}
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            width: '24px',
                            height: '24px',
                        }}
                    />
                    <Image
                        src={images.leftBottom}
                        alt="left-bottom-corner"
                        width={24}
                        height={24}
                        style={{
                            position: 'absolute',
                            left: 0,
                            bottom: 0,
                            width: '24px',
                            height: '24px',
                        }}
                    />
                    <Image
                        src={images.rightBottom}
                        alt="right-bottom-corner"
                        width={24}
                        height={24}
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
                            src={images.arrowRight}
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

const ParamsSchema = z.object({
    hash: z.string().optional(),
});

const getHandler = async (request: NextRequest, context?: NextRequestContext, env?: OgEnv) => {
    const { hash } = await getParamsWithZodSchema(ParamsSchema, context);
    if (!hash)
        return createProxyImageResponse(getDefaultOgImageUrl(), (path) =>
            env!.ASSETS.fetch(new Request(new URL(path, request.url))),
        );

    const tip = await getTipsTransactionDetail(hash, TipsNotificationType.Tip);
    if (!tip)
        return createProxyImageResponse(getDefaultOgImageUrl(), (path) =>
            env!.ASSETS.fetch(new Request(new URL(path, request.url))),
        );

    const assets = env!.ASSETS;
    const images = await loadTipOgImages(assets);

    return createOgImageResponse(await TipOpenGraphImage({ tip, images }), {
        width: 1200,
        height: 630,
        fonts: await getOgSatoriFonts(['Inter', 'NotoSans', 'Bedstead'], new URL(request.url).origin, assets),
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
