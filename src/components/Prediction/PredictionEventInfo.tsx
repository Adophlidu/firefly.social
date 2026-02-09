'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { memo, type ReactNode } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { PredictionDescription } from '@/components/Prediction/PredictionDescription.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { Link } from '@/esm/Link.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { getPolymarketOpenInterest } from '@/providers/firefly/prediction/getPolymarketOpenInterest.js';
import type { BetsEventTagForUI } from '@/types/prediction.js';

interface PredictionEventInfoProps {
    platform: PredictionPlatform;
    volume: string;
    endDate: number;
    tags?: BetsEventTagForUI[];
    description?: string;
    eventId?: string;
    marketId?: string;
}
interface InfoItemProps {
    label: ReactNode;
    value?: string;
    loading?: boolean;
}

function InfoItem({ label, value, loading }: InfoItemProps) {
    return (
        <div className="flex h-[62px] min-w-0 flex-1 shrink-0 flex-col gap-1 rounded-xl bg-lightBg p-3">
            <span className="text-xs text-second">{label}</span>
            {loading ? (
                <LoadingIcon size={18} />
            ) : (
                <span className="truncate text-sm font-semibold text-main">{value ?? '-'}</span>
            )}
        </div>
    );
}

export const PredictionEventInfo = memo<PredictionEventInfoProps>(function PredictionEventInfo(props) {
    const id = props.eventId || props.marketId;
    const { data, isLoading } = useQuery({
        queryKey: ['bets', props.platform, 'openInterest', id],
        enabled: !!id && props.platform === PredictionPlatform.Polymarket,
        staleTime: 5 * 60 * 1000, // 5 minutes
        queryFn: async () =>
            getPolymarketOpenInterest({
                marketId: props.marketId,
                eventId: props.eventId,
            }),
        select: (data) => data.reduce((sum, item) => sum + item.amount, 0),
    });

    return (
        <div className="space-y-4 p-4">
            <div className="flex gap-3">
                <InfoItem label={<Trans>Volume</Trans>} value={nFormatter(+props.volume, 2, undefined, true)} />
                {props.platform === PredictionPlatform.Polymarket ? (
                    <InfoItem
                        loading={isLoading}
                        label={<Trans>Open Interest</Trans>}
                        value={nFormatter(data ?? 0, 2, undefined, true)}
                    />
                ) : (
                    <InfoItem label={<Trans>End Date</Trans>} value={dayjs(props.endDate).format('MMM DD, YYYY')} />
                )}
            </div>
            {props.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                    {props.tags?.map((tag) => (
                        <Link
                            key={tag.id}
                            target="_blank"
                            href={RouteResolver.explorePrediction(tag.slug)}
                            className="h-[26px] rounded-full border border-secondary px-3 text-xs font-medium !leading-[26px] text-main"
                        >
                            {tag.label}
                        </Link>
                    ))}
                </div>
            ) : null}
            {props.description ? (
                <PredictionDescription className="text-sm text-main">{props.description}</PredictionDescription>
            ) : null}
        </div>
    );
});
