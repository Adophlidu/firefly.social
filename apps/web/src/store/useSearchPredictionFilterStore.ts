import { parseAsStringEnum, useQueryState } from 'nuqs';

export const SEARCH_PREDICTION_EVENT_STATUS_PARAM = 'events_status';
export const SEARCH_PREDICTION_EVENT_STATUS_VALUES = ['active', 'resolved'] as const;

export type SearchPredictionEventStatus = (typeof SEARCH_PREDICTION_EVENT_STATUS_VALUES)[number];

export function isSearchPredictionEventStatus(value: string | null | undefined): value is SearchPredictionEventStatus {
    return SEARCH_PREDICTION_EVENT_STATUS_VALUES.includes(value as SearchPredictionEventStatus);
}

export function useSearchPredictionEventStatus() {
    return useQueryState<SearchPredictionEventStatus>(
        SEARCH_PREDICTION_EVENT_STATUS_PARAM,
        parseAsStringEnum<SearchPredictionEventStatus>([...SEARCH_PREDICTION_EVENT_STATUS_VALUES])
            .withDefault('active')
            .withOptions({ clearOnDefault: true }),
    );
}
