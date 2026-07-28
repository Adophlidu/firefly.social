/* eslint-disable @next/next/no-img-element */

import { CACHE_AGE_INDEFINITE_ON_DISK } from '@dimensiondev/constants/static';
import { Source } from '@dimensiondev/enums';
import type { ApiContext } from '@dimensiondev/ssr';
import type { NextRequestContext } from '@dimensiondev/types';
import { getChainIcon } from '@dimensiondev/web3/chains';
import { formatAddress } from '@dimensiondev/web3/utils';
import { first } from 'lodash-es';
import type { HTMLProps } from 'react';
import { z } from 'zod';

import type { NextRequest } from '@/compat/next-server.js';
import { ShrankPrice } from '@/components/ShrankPrice.js';
import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { fetchImageAsBase64 } from '@/helpers/fetchAvatarAsBase64.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { getDefaultOgImageUrl } from '@/helpers/getDefaultOgImageUrl.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { getSharerHandle } from '@/helpers/getSharerHandle.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isCrossChainSwap } from '@/helpers/isCrossChainSwap.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getSwapActivityByHash } from '@/providers/firefly/endpoint/getSwapActivityByHash.js';
import type { SwapActivity } from '@/providers/types/Firefly.js';
import { createOgImageResponse } from '@/services/og/createOgImageResponse.js';
import {
    getOgSatoriFonts,
    loadImageDataUri,
    loadStaticImageDataUri,
    loadSvgDataUri,
    type OgAssets,
} from '@/services/og/loadOgAsset.js';

const OG_FONT_FAMILY = '"Inter", "NotoSans"';

interface OgEnv {
    ASSETS: OgAssets;
}

async function loadSwapOgImages(assets: OgAssets) {
    const [bridgeBackground, swapBackground, copyTradeButton, fallbackAvatar] = await Promise.all([
        loadSvgDataUri(assets, '/svg/bridge-og-background.svg'),
        loadSvgDataUri(assets, '/svg/swap-og-background.svg'),
        loadSvgDataUri(assets, '/svg/copy-trade-button.svg'),
        loadImageDataUri(assets, '/image/firefly-light-avatar.png'),
    ]);
    return { bridgeBackground, swapBackground, copyTradeButton, fallbackAvatar };
}

type SwapOgImages = Awaited<ReturnType<typeof loadSwapOgImages>>;

/** Chain icons are the site's own static assets (e.g. /image/chains/ethereum.png). */
async function loadChainIcon(assets: OgAssets, chainId?: number) {
    const path = chainId ? getChainIcon(chainId) : undefined;
    if (!path) return null;

    try {
        return await loadStaticImageDataUri(assets, path);
    } catch {
        return null;
    }
}

function Image({ src, ...props }: Pick<HTMLProps<'img'>, 'src' | 'alt' | 'width' | 'height' | 'style'>) {
    return <img alt="img" {...props} src={src} />;
}

async function SwapOpenGraphImage({
    swap,
    sharerHandle,
    images,
    assets,
}: {
    swap: SwapActivity;
    sharerHandle?: string | null;
    images: SwapOgImages;
    assets: OgAssets;
}) {
    const fromToken = await fetchImageAsBase64(swap.from_token?.logo, images.fallbackAvatar);
    const toToken = await fetchImageAsBase64(swap.to_token?.logo, images.fallbackAvatar);

    const chainIcon = await loadChainIcon(assets, swap.chain_id);
    const toChainIcon = swap.to_chain_id ? await loadChainIcon(assets, swap.to_chain_id) : null;

    const fromTokenAmountNum = Number(swap.from_token?.amount_num);
    const toTokenAmountNum = Number(swap.to_token?.amount_num);

    const avatarUrl = swap.displayInfo?.avatarUrl || getStampAvatarByProfileId(Source.Wallet, swap.owner);
    const avatar = await fetchImageAsBase64(avatarUrl, images.fallbackAvatar);

    const backgroundImage = isCrossChainSwap(swap) ? images.bridgeBackground : images.swapBackground;

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
                src={backgroundImage}
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
            {sharerHandle ? (
                <div
                    style={{
                        position: 'absolute',
                        top: '24px',
                        left: '24px',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#767676',
                        fontFamily: OG_FONT_FAMILY,
                        display: 'flex',
                    }}
                >
                    Shared by @{sharerHandle}
                </div>
            ) : null}
            <div style={{ display: 'flex', position: 'absolute', top: '200px', left: '312px' }}>
                {fromToken ? (
                    <Image
                        src={fromToken}
                        alt="from-token"
                        width={128}
                        height={128}
                        style={{ width: '128px', height: '128px', borderRadius: '999px' }}
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
                    <Image
                        src={chainIcon}
                        alt="chain-icon"
                        width={48}
                        height={48}
                        style={{ width: '48px', height: '48px', borderRadius: '12px' }}
                    />
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
                    <Image
                        src={toToken}
                        alt="to-token"
                        width={128}
                        height={128}
                        style={{ width: '128px', height: '128px', borderRadius: '999px' }}
                    />
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
                        style={{ width: '48px', height: '48px', borderRadius: '12px' }}
                    />
                ) : chainIcon ? (
                    <Image
                        src={chainIcon}
                        alt="chain-icon"
                        width={48}
                        height={48}
                        style={{ width: '48px', height: '48px', borderRadius: '12px' }}
                    />
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
                    <Image
                        src={avatar}
                        alt="avatar"
                        width={88}
                        height={88}
                        style={{ width: '88px', height: '88px', borderRadius: '999px' }}
                    />
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
                <Image
                    src={images.copyTradeButton}
                    alt="copy-trade-button"
                    width={272}
                    height={48}
                    style={{ width: '272px', height: '48px' }}
                />
            </div>
        </div>
    );
}

const ParamsSchema = z.object({
    hash: z.string().optional(),
    chainId: z.coerce.number().optional(),
});

const getHandler = async (request: NextRequest, context?: NextRequestContext, env?: OgEnv) => {
    const { hash, chainId } = await getParamsWithZodSchema(ParamsSchema, context);
    if (!hash || !chainId)
        return createProxyImageResponse(getDefaultOgImageUrl(), (path) =>
            env!.ASSETS.fetch(new Request(new URL(path, request.url))),
        );

    const activity = await getSwapActivityByHash(hash, chainId);
    if (!activity)
        return createProxyImageResponse(getDefaultOgImageUrl(), (path) =>
            env!.ASSETS.fetch(new Request(new URL(path, request.url))),
        );

    const assets = env!.ASSETS;
    const [sharerHandle, images] = await Promise.all([
        getSharerHandle(new URL(request.url).searchParams.get('sid')),
        loadSwapOgImages(assets),
    ]);

    return createOgImageResponse(await SwapOpenGraphImage({ swap: activity, sharerHandle, images, assets }), {
        width: 1200,
        height: 630,
        fonts: await getOgSatoriFonts(['Inter', 'NotoSans'], new URL(request.url).origin, assets),
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
