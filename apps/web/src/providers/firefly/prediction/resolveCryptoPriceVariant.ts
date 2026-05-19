import { unreachable } from '@dimensiondev/utils';

import { CryptoPriceVariant } from '@/providers/prediction/polymarket/constants.js';
import { PredictionRecurrence } from '@/types/prediction.js';

export function resolveCryptoPriceVariant(recurrence: PredictionRecurrence) {
    switch (recurrence) {
        case PredictionRecurrence.FifteenMinutes:
            return CryptoPriceVariant.Fifteen;
        case PredictionRecurrence.FiveMinutes:
            return CryptoPriceVariant.FiveMinutes;
        case PredictionRecurrence.FourHours:
            return CryptoPriceVariant.FourHour;
        case PredictionRecurrence.Daily:
            return CryptoPriceVariant.Day;
        case PredictionRecurrence.Hour:
            return CryptoPriceVariant.Hour;
        default:
            unreachable(recurrence);
    }
}
