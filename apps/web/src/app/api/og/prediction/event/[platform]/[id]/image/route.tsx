/* eslint-disable @next/next/no-img-element */
import { CACHE_AGE_INDEFINITE_ON_DISK } from '@dimensiondev/constants/static';
import { BetsPriceTimeRange, PredictionPlatform } from '@dimensiondev/enums';
import type { NextRequestContext } from '@dimensiondev/types';
import { compose } from '@dimensiondev/utils';
import { first } from 'lodash-es';
import { ImageResponse } from 'next/og.js';
import type { NextRequest } from 'next/server.js';
import type { HTMLProps } from 'react';
import { z } from 'zod';

import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { getDefaultOgImageUrl } from '@/helpers/getDefaultOgImageUrl.js';
import { fetchImageAsBase64 } from '@/helpers/fetchAvatarAsBase64.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { getPublicUrl } from '@/helpers/getPublicUrl.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { getSharerHandle } from '@/helpers/getSharerHandle.js';
import { type GameMarketOgData, resolveGameMarketOgData } from '@/helpers/prediction/resolveGameMarketOgData.js';
import {
    compareScorePair,
    getScoreValue,
    getTennisSetKey,
    getTieBreakValue,
} from '@/helpers/prediction/sportScoreUtils.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getEventDetail } from '@/providers/firefly/prediction/getEventDetail.js';
import { getBetsMarketPriceHistory } from '@/providers/prediction/getBetsMarketPriceHistory.js';
import { getSatoriFonts } from '@/services/getSatoriFonts.js';
import type { BetsEventDataForUI, SportScore, SportTeam } from '@/types/prediction.js';

const OG_FONT_FAMILY = '"Inter", "NotoSansSC"';
const OG_FALLBACK_IMAGE = getPublicUrl('/image/firefly-light-avatar.png');
const FIREFLY_LOGO_SVG = getPublicUrl('/image/simple-firefly-logo.png');

function Image({ src, ...props }: Pick<HTMLProps<'img'>, 'src' | 'alt' | 'width' | 'height' | 'style'>) {
    return <img alt="img" {...props} src={src} />;
}

interface SimplePriceChartProps {
    data: Array<Record<string, string | number>>;
    marketId: string;
    width: number;
    height: number;
}

function SimplePriceChart({ data, marketId, width, height }: SimplePriceChartProps) {
    if (!data.length) return null;

    const prices = data.map((item) => (Number.isNaN(+item[marketId]) ? 0 : +item[marketId]));

    const validPrices = prices.filter((p) => p > 0);

    if (validPrices.length < 2) return null;

    const minPrice = Math.min(...validPrices);
    const maxPrice = Math.max(...validPrices);
    const priceRange = maxPrice - minPrice || 0.1;

    const padding = 10;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = prices
        .map((price, index) => {
            const x = padding + (index / (prices.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <svg width={width} height={height} style={{ display: 'flex' }}>
            <polyline
                points={points}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

const DEFAULT_HOME_COLOR = '#BB761B';
const DEFAULT_AWAY_COLOR = '#87BFFF';

/** Appends an 8-bit hex alpha suffix to a 6-digit hex color; returns the color untouched otherwise. */
function withAlpha(color: string, alphaHex: string): string {
    return /^#[0-9a-fA-F]{6}$/.test(color) ? `${color}${alphaHex}` : color;
}

/** Whole numbers render without a decimal ("50"); otherwise one decimal place ("53.3"). */
function formatPercent(value: number): string {
    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function TeamLogo({ src, team, side }: { src: string | null; team: SportTeam; side: 'left' | 'right' }) {
    const color = team.color || (side === 'left' ? DEFAULT_HOME_COLOR : DEFAULT_AWAY_COLOR);
    const positionStyle = side === 'left' ? { left: '85px' } : { right: '85px' };
    const label = (team.abbreviation || team.name || '').slice(0, 3).toUpperCase();

    return (
        <div
            style={{
                position: 'absolute',
                // Centered (249 + 290/2 = 394) on the same axis as the center score/probability block,
                // matching the detail page where logos and the center column share one vertical center.
                top: '249px',
                width: '250px',
                height: '290px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...positionStyle,
            }}
        >
            {src ? (
                <Image
                    src={src}
                    alt="team"
                    width={250}
                    height={290}
                    style={{ width: '250px', height: '290px', objectFit: 'contain' }}
                />
            ) : (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '200px',
                        height: '200px',
                        borderRadius: '24px',
                        backgroundColor: withAlpha(color, '1f'),
                        color,
                        fontSize: '72px',
                        fontWeight: 700,
                    }}
                >
                    {label}
                </div>
            )}
        </div>
    );
}

const SCORE_COLOR = '#000000';
const SCORE_MUTED_COLOR = 'rgba(0, 0, 0, 0.4)';

function SingleScore({
    homeScore,
    awayScore,
    loser,
}: {
    homeScore: number;
    awayScore: number;
    loser?: 'home' | 'away';
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '28px', width: '410px' }}>
            <span
                style={{
                    display: 'flex',
                    fontSize: '88px',
                    fontWeight: 700,
                    lineHeight: '88px',
                    color: loser === 'home' ? SCORE_MUTED_COLOR : SCORE_COLOR,
                }}
            >
                {`${homeScore}`}
            </span>
            <span style={{ display: 'flex', fontSize: '56px', fontWeight: 700, lineHeight: '88px', color: '#999999' }}>
                -
            </span>
            <span
                style={{
                    display: 'flex',
                    fontSize: '88px',
                    fontWeight: 700,
                    lineHeight: '88px',
                    color: loser === 'away' ? SCORE_MUTED_COLOR : SCORE_COLOR,
                }}
            >
                {`${awayScore}`}
            </span>
        </div>
    );
}

function TennisValue({ value, tieBreak, muted }: { value?: number; tieBreak?: number; muted?: boolean }) {
    const color = muted ? SCORE_MUTED_COLOR : SCORE_COLOR;
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ display: 'flex', fontSize: '48px', fontWeight: 700, lineHeight: '52px', color }}>
                {value === undefined ? '-' : `${value}`}
            </span>
            {tieBreak === undefined ? null : (
                <span style={{ display: 'flex', fontSize: '20px', lineHeight: '24px', marginLeft: '2px', color }}>
                    {`${tieBreak}`}
                </span>
            )}
        </div>
    );
}

function MultiSetScore({ scores }: { scores: SportScore[] }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '28px', width: '410px' }}>
            {scores.map((set, index) => {
                const comparison = compareScorePair(set.score, set.memo);
                return (
                    <div
                        key={getTennisSetKey(scores, index)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                    >
                        <TennisValue
                            value={getScoreValue(set.score, 0)}
                            tieBreak={getTieBreakValue(set.memo, 0)}
                            muted={comparison < 0}
                        />
                        <TennisValue
                            value={getScoreValue(set.score, 1)}
                            tieBreak={getTieBreakValue(set.memo, 1)}
                            muted={comparison > 0}
                        />
                    </div>
                );
            })}
        </div>
    );
}

function ScoreCenter({ gameData }: { gameData: GameMarketOgData }) {
    const { scores, homeScore, awayScore, multipleSets, loser } = gameData;
    const showSets = multipleSets && scores.length > 1;
    return showSets ? (
        <MultiSetScore scores={scores} />
    ) : (
        <SingleScore homeScore={homeScore} awayScore={awayScore} loser={loser} />
    );
}

async function GameMarketOgImage({ gameData }: { gameData: GameMarketOgData }) {
    const { homeTeam, awayTeam, homePercent, awayPercent, homeRatio, awayRatio, volume, state, leagueName } = gameData;
    const homeColor = homeTeam.color || DEFAULT_HOME_COLOR;
    const awayColor = awayTeam.color || DEFAULT_AWAY_COLOR;
    // Mirror the detail page header (SportEventPageTitle): "{home} vs. {away}" instead of the raw
    // event.title, so the game OG image and the detail page show the same title.
    const gameTitle = `${homeTeam.name || homeTeam.abbreviation || 'Home'} vs. ${awayTeam.name || awayTeam.abbreviation || 'Away'}`;

    const [homeLogo, awayLogo] = await Promise.all([
        homeTeam.logo ? fetchImageAsBase64(homeTeam.logo) : Promise.resolve(null),
        awayTeam.logo ? fetchImageAsBase64(awayTeam.logo) : Promise.resolve(null),
    ]);

    return (
        <div
            style={{
                width: '1200px',
                height: '630px',
                display: 'flex',
                position: 'relative',
                backgroundColor: '#FFFFFF',
                fontFamily: OG_FONT_FAMILY,
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '600px',
                    height: '630px',
                    display: 'flex',
                    backgroundImage: `linear-gradient(to left, ${withAlpha(homeColor, '00')} 0%, ${withAlpha(homeColor, '52')} 100%)`,
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '600px',
                    height: '630px',
                    display: 'flex',
                    backgroundImage: `linear-gradient(to right, ${withAlpha(awayColor, '00')} 0%, ${withAlpha(awayColor, '52')} 100%)`,
                }}
            />

            <Image
                src={FIREFLY_LOGO_SVG}
                alt="firefly"
                width={128}
                height={40}
                style={{
                    position: 'absolute',
                    top: '24px',
                    // Inset from the edge so the logo stays inside a 16:9 center-crop
                    // (Firefly's feed embed and external link previews crop the 1200x630 image).
                    right: '64px',
                    width: '128px',
                    height: '40px',
                    objectFit: 'contain',
                }}
            />

            <div
                style={{
                    position: 'absolute',
                    top: '112px',
                    left: 0,
                    width: '1200px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '0 120px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        fontSize: '48px',
                        fontWeight: 600,
                        color: '#000000',
                        lineHeight: '56px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                    }}
                >
                    {gameTitle}
                </div>
                {leagueName ? (
                    <div
                        style={{
                            display: 'flex',
                            fontSize: '32px',
                            fontWeight: 600,
                            color: '#B5B7BB',
                            lineHeight: '32px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                        }}
                    >
                        {leagueName}
                    </div>
                ) : null}
            </div>

            <TeamLogo src={homeLogo} team={homeTeam} side="left" />
            <TeamLogo src={awayLogo} team={awayTeam} side="right" />

            <div
                style={{
                    position: 'absolute',
                    top: '317px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '410px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {state === 'upcoming' ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '410px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-end',
                                width: '410px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    fontSize: '64px',
                                    fontWeight: 700,
                                    color: homeColor,
                                    lineHeight: '64px',
                                }}
                            >
                                {formatPercent(homePercent)}%
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    fontSize: '64px',
                                    fontWeight: 700,
                                    color: awayColor,
                                    lineHeight: '64px',
                                }}
                            >
                                {formatPercent(awayPercent)}%
                            </div>
                        </div>
                        <div style={{ display: 'flex', width: '410px', height: '28px', marginTop: '12px', gap: '8px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    flexBasis: `${homeRatio * 100}%`,
                                    minWidth: 0,
                                    height: '28px',
                                    backgroundColor: homeColor,
                                    borderRadius: '2px',
                                    transform: 'skewX(-14deg)',
                                }}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                    flexBasis: `${awayRatio * 100}%`,
                                    minWidth: 0,
                                    height: '28px',
                                    backgroundColor: awayColor,
                                    borderRadius: '2px',
                                    transform: 'skewX(-14deg)',
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <ScoreCenter gameData={gameData} />
                )}
                <div
                    style={{
                        display: 'flex',
                        marginTop: '24px',
                        fontSize: '32px',
                        fontWeight: 600,
                        color: '#000000',
                        lineHeight: '32px',
                    }}
                >
                    ${nFormatter(parseFloat(volume))} Vol.
                </div>
            </div>
        </div>
    );
}

async function PredictionEventOgImage({
    event,
    platform,
    sharerHandle,
}: {
    event: BetsEventDataForUI;
    platform: PredictionPlatform;
    sharerHandle?: string | null;
}) {
    const gameData = resolveGameMarketOgData(event);
    if (gameData) return GameMarketOgImage({ gameData });

    const eventImage = await fetchImageAsBase64(event.image, OG_FALLBACK_IMAGE);
    const isSingleMarket = event.markets.length === 1;

    let priceHistory: Array<Record<string, string | number>> | null = null;
    if (isSingleMarket) {
        const market = first(event.markets);
        const firstOutcome = first(market?.outcomes);
        if (market && firstOutcome) {
            try {
                priceHistory = await getBetsMarketPriceHistory(platform, {
                    markets: [market],
                    timeRange: BetsPriceTimeRange.All,
                    outcomeId: firstOutcome.id,
                    isSingleMarket: true,
                });
            } catch {
                priceHistory = null;
            }
        }
        const secondOutcome = market?.outcomes[1];
        const firstPrice = Number.parseFloat(firstOutcome?.price || '0');
        const secondPrice = Number.parseFloat(secondOutcome?.price || '0');
        const firstCents = (firstPrice * 100).toFixed(1);
        const secondCents = (secondPrice * 100).toFixed(1);

        return (
            <div
                style={{
                    width: '1200px',
                    height: '630px',
                    display: 'flex',
                    backgroundColor: '#FFFFFF',
                    fontFamily: OG_FONT_FAMILY,
                }}
            >
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
                <div
                    style={{
                        width: '570px',
                        height: '630px',
                        display: 'flex',
                    }}
                >
                    {eventImage ? (
                        <Image
                            src={eventImage}
                            alt="event"
                            width={570}
                            height={630}
                            style={{
                                width: '570px',
                                height: '630px',
                                objectFit: 'cover',
                            }}
                        />
                    ) : null}
                </div>

                <div
                    style={{
                        width: '630px',
                        height: '630px',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '48px 48px 64px 24px',
                        position: 'relative',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '18px',
                                color: '#767676',
                                display: 'flex',
                                fontWeight: 700,
                                lineHeight: '24px',
                            }}
                        >
                            ${nFormatter(parseFloat(event.volume))} Vol.
                        </div>
                        <Image
                            src={FIREFLY_LOGO_SVG}
                            alt="firefly"
                            width={128}
                            height={40}
                            style={{ width: '128px', height: '40px', objectFit: 'cover' }}
                        />
                    </div>
                    <div
                        style={{
                            fontSize: '28px',
                            fontWeight: 700,
                            color: '#000000',
                            lineHeight: '1.3',
                            marginBottom: '32px',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {event.title}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            marginTop: 'auto',
                        }}
                    >
                        {priceHistory && priceHistory.length > 0 && market ? (
                            <div
                                style={{
                                    width: '100%',
                                    height: '200px',
                                    marginBottom: '32px',
                                    display: 'flex',
                                }}
                            >
                                <SimplePriceChart
                                    data={priceHistory}
                                    marketId={platform === PredictionPlatform.Opinion ? market.questionId : market.id}
                                    width={558}
                                    height={200}
                                />
                            </div>
                        ) : null}
                        {firstOutcome || secondOutcome ? (
                            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                {firstOutcome ? (
                                    <div
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            height: '48px',
                                            backgroundColor: '#DCF1D9',
                                            color: '#48AD3C',
                                            fontSize: '16px',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '12px',
                                            gap: '8px',
                                            padding: '0 16px',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <span
                                            style={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            Buy {firstOutcome.label}
                                        </span>
                                        <span style={{ flexShrink: 0 }}>{firstCents}¢</span>
                                    </div>
                                ) : null}
                                {secondOutcome ? (
                                    <div
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            height: '48px',
                                            backgroundColor: '#FFE6E4',
                                            color: '#FF564D',
                                            fontSize: '16px',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '12px',
                                            gap: '8px',
                                            padding: '0 16px',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <span
                                            style={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            Buy {secondOutcome.label}
                                        </span>
                                        <span style={{ flexShrink: 0 }}>{secondCents}¢</span>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }

    const displayMarkets = event.markets.slice(0, 4);

    return (
        <div
            style={{
                width: '1200px',
                height: '630px',
                display: 'flex',
                backgroundColor: '#FFFFFF',
                fontFamily: OG_FONT_FAMILY,
            }}
        >
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
            <div
                style={{
                    width: '570px',
                    height: '630px',
                    display: 'flex',
                }}
            >
                {eventImage ? (
                    <Image
                        src={eventImage}
                        alt="event"
                        width={570}
                        height={630}
                        style={{
                            width: '570px',
                            height: '630px',
                            objectFit: 'cover',
                        }}
                    />
                ) : null}
            </div>

            <div
                style={{
                    width: '630px',
                    height: '630px',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '48px 48px 64px 24px',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px',
                    }}
                >
                    <div
                        style={{
                            fontSize: '18px',
                            color: '#767676',
                            display: 'flex',
                            fontWeight: 700,
                            lineHeight: '24px',
                        }}
                    >
                        ${nFormatter(parseFloat(event.volume))} Vol.
                    </div>
                    <Image
                        src={FIREFLY_LOGO_SVG}
                        alt="firefly"
                        width={128}
                        height={40}
                        style={{ width: '128px', height: '40px', objectFit: 'cover' }}
                    />
                </div>
                <div
                    style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        color: '#000000',
                        lineHeight: '1.3',
                        marginBottom: '32px',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {event.title}
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        marginTop: 'auto',
                    }}
                >
                    {displayMarkets.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    fontSize: '12px',
                                    color: '#b1b1b1',
                                    fontWeight: 500,
                                    lineHeight: '16px',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                <div style={{ width: '240px', display: 'flex' }}>OUTCOME</div>
                                <div style={{ width: '60px', display: 'flex' }}>CHANCE</div>
                                <div style={{ width: '206px', height: '36px', display: 'flex' }} />
                            </div>

                            {displayMarkets.map((market, index) => {
                                const firstOutcome = market.outcomes[0];
                                const secondOutcome = market.outcomes[1];
                                const firstPrice = Number.parseFloat(firstOutcome?.price || '0');
                                const secondPrice = Number.parseFloat(secondOutcome?.price || '0');
                                const firstPercent = Math.round(firstPrice * 100);
                                const firstCents = (firstPrice * 100).toFixed(1);
                                const secondCents = (secondPrice * 100).toFixed(1);

                                return (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '240px',
                                                fontSize: '16px',
                                                color: '#181818',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                lineHeight: '24px',
                                                display: 'flex',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {market.title}
                                        </div>

                                        <div
                                            style={{
                                                width: '60px',
                                                display: 'flex',
                                                fontSize: '16px',
                                                color: '#181818',
                                                fontWeight: 600,
                                                lineHeight: '24px',
                                            }}
                                        >
                                            {firstPercent}%
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {firstOutcome ? (
                                                <div
                                                    style={{
                                                        width: '99px',
                                                        height: '36px',
                                                        backgroundColor: '#DCF1D9',
                                                        color: '#48AD3C',
                                                        fontSize: '10px',
                                                        fontWeight: 700,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        whiteSpace: 'nowrap',
                                                        padding: '0 8px',
                                                        gap: '4px',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {firstOutcome.label}
                                                    </span>
                                                    <span style={{ flexShrink: 0 }}>{firstCents}¢</span>
                                                </div>
                                            ) : null}
                                            {secondOutcome ? (
                                                <div
                                                    style={{
                                                        width: '99px',
                                                        height: '36px',
                                                        backgroundColor: '#FFE6E4',
                                                        color: '#FF564D',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        whiteSpace: 'nowrap',
                                                        padding: '0 8px',
                                                        gap: '4px',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {secondOutcome.label}
                                                    </span>
                                                    <span style={{ flexShrink: 0 }}>{secondCents}¢</span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

async function createPredictionEventOgImageResponse({
    event,
    platform,
    sharerHandle,
}: {
    event: BetsEventDataForUI;
    platform: PredictionPlatform;
    sharerHandle?: string | null;
}) {
    return new ImageResponse(await PredictionEventOgImage({ event, platform, sharerHandle }), {
        width: 1200,
        height: 630,
        fonts: await getSatoriFonts(['Inter', 'NotoSansSC']),
        headers: {
            'Cache-Control': CACHE_AGE_INDEFINITE_ON_DISK,
        },
    });
}

const ParamsSchema = z.object({
    platform: z.enum([PredictionPlatform.Polymarket, PredictionPlatform.Opinion]),
    id: z.string().optional(),
});

const SearchParamsSchema = z.object({
    type: z.string().optional(),
});

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest, context?: NextRequestContext) => {
    const { platform, id } = await getParamsWithZodSchema(ParamsSchema, context);
    if (!id) return createProxyImageResponse(getDefaultOgImageUrl());

    const { type } = getSearchParamsWithZodSchema(request, SearchParamsSchema);

    const event = await getEventDetail(platform, { id, isMutil: type === 'multi' });
    if (!event) return createProxyImageResponse(getDefaultOgImageUrl());

    const sharerHandle = await getSharerHandle(request.nextUrl.searchParams.get('sid'));

    return createPredictionEventOgImageResponse({ event, platform, sharerHandle });
});
