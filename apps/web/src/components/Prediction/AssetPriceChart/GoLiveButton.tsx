import type { PredictionPlatform } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ActiveTag } from '@/components/Prediction/PredictionSeries/ActiveTag.js';
import { queryClient } from '@/configs/queryClient.js';
import { STALE_TIMES } from '@/constants/query.js';
import { useRouter } from '@/esm/navigation.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { resolvePredictionEventUrl } from '@/helpers/resolvePredictionEventUrl.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { logger } from '@/libs/Logger.js';
import { getEventsBySeries } from '@/providers/firefly/prediction/getEventsBySeries.js';
import { PredictionRecurrence } from '@/types/prediction.js';

interface GoLiveButtonProps {
    platform: PredictionPlatform;
    seriesId: string;
    recurrence: PredictionRecurrence;
}

export const GoLiveButton = memo<GoLiveButtonProps>(function GoLiveButton({ platform, seriesId, recurrence }) {
    const router = useRouter();
    const isMedium = useIsMedium();

    const [{ loading }, openLiveMarket] = useAsyncFn(async () => {
        try {
            const events = await queryClient.fetchQuery({
                queryKey: [Source.Prediction, 'series', platform, seriesId],
                staleTime: recurrence === PredictionRecurrence.Daily ? STALE_TIMES.HOUR_1 : STALE_TIMES.MINUTE_2,
                queryFn: () =>
                    getEventsBySeries(platform, seriesId, recurrence === PredictionRecurrence.FiveMinutes ? 490 : 200),
            });
            const liveEvent =
                events.find(
                    (x) =>
                        x.startTime &&
                        x.endDate &&
                        Date.now() >= new Date(x.startTime).getTime() &&
                        Date.now() <= new Date(x.endDate).getTime() &&
                        x.markets.some((m) => !m.resolvedOutcomeId),
                ) ||
                events.findLast((x) => x.markets.some((m) => !m.resolvedOutcomeId)) ||
                events[0];
            if (!liveEvent) throw new Error('No event found for series ' + seriesId);

            router.push(resolvePredictionEventUrl(liveEvent));
        } catch (error) {
            enqueueErrorMessage(<Trans>Failed to get live market URL. Please try again later.</Trans>);
            logger.error('Failed to get live market URL', error);
        }
    }, [platform, seriesId, recurrence, router]);

    return (
        <ClickableButton
            disabled={loading}
            className="border-lightLineSecond flex h-[30px] items-center gap-1 rounded-full border px-2.5"
            onClick={openLiveMarket}
        >
            {loading ? <LoadingIcon size={9} /> : <ActiveTag />}
            <span className="text-second text-[10px] font-bold">
                {isMedium ? <Trans>Go to live market</Trans> : <Trans>Live</Trans>}
            </span>
        </ClickableButton>
    );
});
