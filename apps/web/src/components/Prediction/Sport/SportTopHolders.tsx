'use client';

import type { PredictionPlatform } from '@dimensiondev/enums';
import { anySignal, classNames } from '@dimensiondev/utils';
import { formatAddressEthereum } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Loading } from '@/components/Loading.js';
import { STALE_TIMES } from '@/constants/query.js';
import { Link } from '@/esm/Link.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { getBetsMarketTopHolders } from '@/providers/prediction/getBetsMarketTopHolders.js';
import type { BetsMarketDataForUI, BetsTopHolderForUI, SportEventData } from '@/types/prediction.js';

interface SportTopHoldersProps {
    platform: PredictionPlatform;
    market: BetsMarketDataForUI;
    sportData: SportEventData;
}

function HolderRow({
    holder,
    platform,
    teamColor,
}: {
    holder: BetsTopHolderForUI;
    platform: PredictionPlatform;
    teamColor: string;
}) {
    return (
        <Link href={RouteResolver.betsProfile(holder.wallet, { platform })} className="flex items-center gap-2 py-2">
            <Avatar className="shrink-0" src={holder.avatar} size={36} alt={holder.wallet} />
            <div className="min-w-0 flex-1">
                <div className="text-main truncate text-sm font-semibold leading-5">
                    {holder.name || formatAddressEthereum(holder.wallet, 4)}
                </div>
                <div className="text-sm font-semibold leading-5" style={{ color: teamColor }}>
                    <Trans>{toFixedTrimmed(holder.shares, 1)} Shares</Trans>
                </div>
            </div>
        </Link>
    );
}

export const SportTopHolders = memo(function SportTopHolders({ platform, market, sportData }: SportTopHoldersProps) {
    const { homeTeam, awayTeam } = sportData;
    const homeLabel = homeTeam.abbreviation || homeTeam.name || 'Home';
    const awayLabel = awayTeam.abbreviation || awayTeam.name || 'Away';
    const homeColor = homeTeam.color || '#BB761B';
    const awayColor = awayTeam.color || '#87BFFF';

    const { data, error, isLoading, isRefetchError, isPending, refetch } = useQuery({
        queryKey: ['bets', 'top-holders', platform, market.id],
        staleTime: STALE_TIMES.MINUTE_5,
        retry: false,
        queryFn: async ({ signal }) =>
            getBetsMarketTopHolders(platform, {
                market,
                signal: anySignal(AbortSignal.timeout(1000 * 5), signal),
            }),
    });

    if (isLoading || isRefetchError || isPending) return <Loading minHeight={112} />;
    if (error) {
        return (
            <div className="flex h-28 w-full items-center justify-center">
                <ClickableButton
                    onClick={() => refetch()}
                    className="text-second text-sm font-semibold hover:underline"
                >
                    <Trans>Retry</Trans>
                </ClickableButton>
            </div>
        );
    }

    const homeOutcome = market.outcomes[0];
    const awayOutcome = market.outcomes[1];
    if (!homeOutcome || !awayOutcome) return null;

    const homeHolders = data?.find((item) => item.outcome.id === homeOutcome.id)?.holders || [];
    const awayHolders = data?.find((item) => item.outcome.id === awayOutcome.id)?.holders || [];
    const maxRows = Math.max(homeHolders.length, awayHolders.length);
    const holderRows = Array.from({ length: maxRows }, (_, i) => ({
        homeHolder: homeHolders[i],
        awayHolder: awayHolders[i],
        key: `${homeHolders[i]?.wallet ?? 'empty'}-${awayHolders[i]?.wallet ?? 'empty'}`,
    }));

    if (maxRows === 0) return null;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-4">
                <p className="min-w-0 flex-1 text-xs font-medium capitalize leading-4 text-[#767676]">
                    <Trans>{homeLabel} holders</Trans>
                </p>
                <p className="min-w-0 flex-1 text-xs font-medium capitalize leading-4 text-[#767676]">
                    <Trans>{awayLabel} holders</Trans>
                </p>
            </div>
            <div className="flex flex-col">
                {holderRows.map(({ homeHolder, awayHolder, key }, i) => (
                    <div
                        key={key}
                        className={classNames(
                            'flex items-start gap-2 px-4 py-2',
                            i < maxRows - 1 ? 'border-b border-[#f5f5f5]' : '',
                        )}
                    >
                        <div className="min-w-0 flex-1">
                            {homeHolder ? (
                                <HolderRow holder={homeHolder} platform={platform} teamColor={homeColor} />
                            ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                            {awayHolder ? (
                                <HolderRow holder={awayHolder} platform={platform} teamColor={awayColor} />
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
