/** Minimal event shape for EventSeriesPills logic (Polymarket series navigation). */
export interface SeriesEventForPills {
    slug: string;
    endDate?: string;
    eventDate?: string;
    startDate?: string;
    startTime?: string;
    closed?: boolean;
    markets?: Array<{ eventStartTime?: string }>;
}

export type PastMarketVariant = 'fiveminute' | 'fifteen' | 'fourhour' | 'hourly' | 'daily';

export interface SeriesSettings {
    timezone: string;
    shouldShowDetailedTime: boolean;
    useHourlyFiltering: boolean;
    shouldShowLockedPrice: boolean;
    decimalPlaces: number;
}

export type PastOutcome = 'up' | 'down';

export interface PastResultRow {
    startTime: string;
    endTime: string;
    outcome: PastOutcome;
}

export interface PastResultsData {
    outcomesBySlug?: Record<string, PastOutcome>;
    results?: PastResultRow[];
}
