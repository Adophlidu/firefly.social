import { createLookupTableResolver, UnreachableError } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { type JSX } from 'react';

import { TimeRangeFilter } from '@/constants/enum.js';

export const resolveTimeRangeName = createLookupTableResolver<TimeRangeFilter, string | JSX.Element>(
    {
        [TimeRangeFilter.FiveMinutes]: <Trans>5 minutes</Trans>,
        [TimeRangeFilter.OneHour]: <Trans>1 hour</Trans>,
        [TimeRangeFilter.SixHours]: <Trans>6 hours</Trans>,
        [TimeRangeFilter.OneDay]: <Trans>24 hours</Trans>,
    },
    (timeRange: TimeRangeFilter) => {
        throw new UnreachableError('timeRangeName', timeRange);
    },
);

export const resolveTimeRangeShortName = createLookupTableResolver<TimeRangeFilter, string | JSX.Element>(
    {
        [TimeRangeFilter.FiveMinutes]: <Trans>5m</Trans>,
        [TimeRangeFilter.OneHour]: <Trans>1h</Trans>,
        [TimeRangeFilter.SixHours]: <Trans>6h</Trans>,
        [TimeRangeFilter.OneDay]: <Trans>24h</Trans>,
    },
    (timeRange: TimeRangeFilter) => {
        throw new UnreachableError('timeRangeShortName', timeRange);
    },
);

export const resolveTimeRangeSortString = createLookupTableResolver<TimeRangeFilter, string>(
    {
        [TimeRangeFilter.FiveMinutes]: 'm5_trending',
        [TimeRangeFilter.OneHour]: 'h1_trending',
        [TimeRangeFilter.SixHours]: 'h6_trending',
        [TimeRangeFilter.OneDay]: 'h24_trending',
    },
    (timeRange: TimeRangeFilter) => {
        throw new UnreachableError('timeRangeSortString', timeRange);
    },
);
