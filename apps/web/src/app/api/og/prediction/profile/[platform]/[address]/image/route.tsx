/* eslint-disable @next/next/no-img-element */

import type { NextRequestContext } from '@dimensiondev/types';
import { compose } from '@dimensiondev/utils';
import { formatAddress, isSameEthereumAddress } from '@dimensiondev/web3/utils';
import { first } from 'lodash-es';
import { ImageResponse } from 'next/og.js';
import type { NextRequest } from 'next/server.js';
import type { HTMLProps } from 'react';
import { z } from 'zod';

import { extractFallbackInfo } from '@/components/Prediction/extractFallbackInfo.js';
import { PredictionPlatform, Source } from '@/constants/enum.js';
import { CACHE_AGE_INDEFINITE_ON_DISK } from '@/constants/static.js';
import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { fetchImageAsBase64FromUrls } from '@/helpers/fetchAvatarAsBase64.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { getPublicUrl } from '@/helpers/getPublicUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { fetchPredictionProfile } from '@/providers/firefly/prediction/fetchPredictionProfile.js';
import { getWalletProfileInfoList } from '@/providers/firefly/prediction/getWalletProfileInfoList.js';
import { getSatoriFonts } from '@/services/getSatoriFonts.js';
import type { PredictionProfileDataForUI } from '@/types/prediction.js';

const predictionDefaultOgImage = getPublicUrl('/image/og.png');
const bgImageUrl = getPublicUrl('/svg/prediction-profile-background.svg');
const bottomBgImageUrl = getPublicUrl('/svg/prediction-profile-background-bottom.svg');
const vectorBgUrl = getPublicUrl('/svg/prediction-profile-white-background.svg');
const OG_FALLBACK_AVATAR = getPublicUrl('/image/firefly-light-avatar.png');
const FIREFLY_LOGO = getPublicUrl('/image/simple-firefly-logo.png');

const chartWidth = 380;
const chartHeight = 180;
const padding = 4;

function Image({ src, ...props }: Pick<HTMLProps<'img'>, 'src' | 'alt' | 'width' | 'height' | 'style'>) {
    return <img alt="img" {...props} src={src} />;
}

async function getSocialProfile(
    address: string,
    platform: PredictionPlatform,
): Promise<{ name?: string; avatar?: string }> {
    try {
        const res = await getWalletProfileInfoList(address, platform, true);
        const firstEntry = first(res?.data?.walletAddress);
        if (!firstEntry) return {};

        for (const key in firstEntry) {
            if (isSameEthereumAddress(key, address)) {
                const { name, avatar } = extractFallbackInfo(firstEntry[key]);
                return { name, avatar };
            }
        }

        return {};
    } catch {
        return {};
    }
}

async function PredictionProfileOpenGraphImage({
    profile,
    platform,
    address,
}: {
    profile: PredictionProfileDataForUI;
    platform: PredictionPlatform;
    address: string;
}) {
    const { name: socialName, avatar: socialAvatar } = await getSocialProfile(address, platform);

    const stampAvatarUrl = getStampAvatarByProfileId(Source.Wallet, profile.wallet);
    const avatarUrl = socialAvatar || profile.platform_avatar || stampAvatarUrl;

    const avatarBase64 = await fetchImageAsBase64FromUrls(
        avatarUrl === stampAvatarUrl ? [avatarUrl] : [avatarUrl, stampAvatarUrl],
        OG_FALLBACK_AVATAR,
    );

    const displayName = socialName || profile.platform_name || '';
    const pnlHistory = profile.pnl_history;
    const hasHistory = pnlHistory?.pnl_items && pnlHistory.pnl_items.length > 0;
    const netPnl = pnlHistory?.net_pnl || 0;
    const netPnlRate = Math.max(-1, pnlHistory?.net_pnl_rate || 0);

    let chartPath = '';
    let chartAreaPath = '';
    let chartColor = '#57BE4B';
    let gradientId = 'chartGradient';
    if (hasHistory) {
        const items = pnlHistory!.pnl_items;

        const pnlValues = items.map((item) => item.pnl);
        const minPnl = Math.min(...pnlValues);
        const maxPnl = Math.max(...pnlValues);
        const pnlRange = maxPnl - minPnl || 1;

        chartColor = netPnl >= 0 ? '#57BE4B' : '#FF5656';
        gradientId = netPnl >= 0 ? 'chartGradientGreen' : 'chartGradientRed';

        const points = items.map((item, index) => {
            const x = padding + (index / (items.length - 1 || 1)) * (chartWidth - padding * 2);
            const y = chartHeight - padding - ((item.pnl - minPnl) / pnlRange) * (chartHeight - padding * 2);
            return { x, y };
        });

        chartPath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

        const areaPoints = [
            ...points,
            { x: points[points.length - 1].x, y: chartHeight - padding },
            { x: points[0].x, y: chartHeight - padding },
        ];
        chartAreaPath = areaPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    }

    return (
        <div
            style={{
                width: '1200px',
                height: '630px',
                display: 'flex',
                background: 'radial-gradient(154.65% 119.91% at 66.17% 100%, #FFD0EA 16.38%, #FFEDCE 100%)',
                position: 'relative',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: '32px',
                    left: '0',
                    width: '1200px',
                    height: '184px',
                    backgroundImage: `url(${bgImageUrl})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    display: 'flex',
                    zIndex: 1,
                }}
            />

            <div
                style={{
                    position: 'absolute',
                    bottom: '32px',
                    left: '0',
                    width: '1200px',
                    height: '184px',
                    backgroundImage: `url(${bottomBgImageUrl})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    display: 'flex',
                    zIndex: 1,
                }}
            />

            <div
                style={{
                    position: 'absolute',
                    top: '58px',
                    left: '95px',
                    width: '1010px',
                    height: '514px',
                    backgroundImage: `url(${vectorBgUrl})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    display: 'flex',
                    zIndex: 2,
                }}
            />

            <div
                style={{
                    position: 'absolute',
                    top: '58px',
                    left: '95px',
                    display: 'flex',
                    zIndex: 3,
                    padding: '24px 48px',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    width: '1010px',
                    height: '514px',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '35px' }}>
                    <Image
                        src={FIREFLY_LOGO}
                        alt="firefly"
                        width={128}
                        height={40}
                        style={{
                            width: '128px',
                            height: '40px',
                            objectFit: 'cover',
                            zIndex: 3,
                        }}
                    />
                </div>

                {hasHistory ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: '461px',
                            }}
                        >
                            {avatarBase64 ? (
                                <Image
                                    src={avatarBase64}
                                    alt="avatar"
                                    width={192}
                                    height={192}
                                    style={{
                                        width: '192px',
                                        height: '192px',
                                        borderRadius: '96px',
                                        objectFit: 'cover',
                                        marginBottom: '24px',
                                    }}
                                />
                            ) : null}

                            <div
                                style={{
                                    fontSize: '48px',
                                    fontWeight: '700',
                                    color: '#181818',
                                    lineHeight: '56px',
                                    marginBottom: '12px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    maxHeight: '460px',
                                }}
                            >
                                {displayName}
                            </div>

                            <div
                                style={{
                                    fontSize: '24px',
                                    fontWeight: '400',
                                    color: '#767676',
                                    lineHeight: '32px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '461px',
                                    display: 'flex',
                                }}
                            >
                                {profile.wallet ? formatAddress(profile.wallet, 4) : ''}
                            </div>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: '380px',
                                marginTop: '12px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    marginBottom: '24px',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '24px',
                                        fontWeight: '500',
                                        color: '#767676',
                                        lineHeight: '36px',
                                        marginBottom: '12px',
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                    }}
                                >
                                    Past Month PnL(%)
                                </div>
                                <div
                                    style={{
                                        fontSize: '28px',
                                        fontWeight: '600',
                                        color: netPnl >= 0 ? '#57BE4B' : '#FF5656',
                                        lineHeight: '40px',
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {netPnl >= 0 ? '+' : '-'}$
                                    {Math.abs(netPnl).toLocaleString('en-US', {
                                        minimumFractionDigits: 1,
                                        maximumFractionDigits: 1,
                                    })}
                                    ({(netPnlRate * 100).toFixed(1)}%)
                                </div>
                            </div>

                            {chartPath ? (
                                <div
                                    style={{
                                        width: '380px',
                                        height: '180px',
                                        display: 'flex',
                                    }}
                                >
                                    <svg width="380" height="180" viewBox="0 0 380 180">
                                        <defs>
                                            <linearGradient id="chartGradientGreen" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#57BE4B" stopOpacity="0.3" />
                                                <stop offset="100%" stopColor="#57BE4B" stopOpacity="0" />
                                            </linearGradient>
                                            <linearGradient id="chartGradientRed" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#FF5656" stopOpacity="0.3" />
                                                <stop offset="100%" stopColor="#FF5656" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        <path d={chartAreaPath} fill={`url(#${gradientId})`} />
                                        <path
                                            d={chartPath}
                                            fill="none"
                                            stroke={chartColor}
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '48px',
                        }}
                    >
                        {avatarBase64 ? (
                            <Image
                                src={avatarBase64}
                                alt="avatar"
                                width={192}
                                height={192}
                                style={{
                                    width: '192px',
                                    height: '192px',
                                    borderRadius: '96px',
                                    objectFit: 'cover',
                                }}
                            />
                        ) : null}

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '48px',
                                    fontWeight: '700',
                                    color: '#181818',
                                    lineHeight: '56px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                }}
                            >
                                {displayName}
                            </div>

                            <div
                                style={{
                                    fontSize: '24px',
                                    fontWeight: '400',
                                    color: '#767676',
                                    lineHeight: '32px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                }}
                            >
                                {profile.wallet ? formatAddress(profile.wallet, 4) : ''}
                            </div>

                            <div
                                style={{
                                    fontSize: '32px',
                                    fontWeight: '600',
                                    color: profile.pnl >= 0 ? '#57BE4B' : '#FF5656',
                                    lineHeight: '40px',
                                    display: 'flex',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <span style={{ color: '#767676', marginRight: '8px', display: 'flex' }}>PnL</span>
                                {profile.pnl >= 0 ? '+' : '-'}$
                                {Math.abs(profile.pnl).toLocaleString('en-US', {
                                    minimumFractionDigits: 1,
                                    maximumFractionDigits: 1,
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

async function createPredictionProfileOpenGraphImageResponse({
    profile,
    platform,
    address,
}: {
    profile: PredictionProfileDataForUI;
    platform: PredictionPlatform;
    address: string;
}) {
    return new ImageResponse(await PredictionProfileOpenGraphImage({ profile, platform, address }), {
        width: 1200,
        height: 630,
        fonts: await getSatoriFonts(['Bedstead', 'NotoSansSC']),
        headers: {
            'Cache-Control': CACHE_AGE_INDEFINITE_ON_DISK,
        },
    });
}

const ParamsSchema = z.object({
    address: z.string().optional(),
    platform: z.nativeEnum(PredictionPlatform).optional(),
});

export const GET = compose(
    withRequestErrorHandler(),
    async (
        request: NextRequest,
        context?: NextRequestContext<{
            address?: string;
            platform?: string;
        }>,
    ) => {
        const { address, platform } = await getParamsWithZodSchema(ParamsSchema, context);
        if (!address || !platform) return createProxyImageResponse(predictionDefaultOgImage);

        const profileData = await fetchPredictionProfile(address, platform, true);
        if (!profileData) {
            return createProxyImageResponse(predictionDefaultOgImage);
        }

        return createPredictionProfileOpenGraphImageResponse({ profile: profileData, platform, address });
    },
);
