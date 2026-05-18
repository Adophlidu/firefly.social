import { PredictionPlatform } from '@dimensiondev/enums';

import { RouteResolver } from '@/helpers/RouteResolver.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

export function resolvePredictionEventUrl(event: BetsEventDataForUI) {
    return RouteResolver.betsEventDetail(
        event.platform,
        event.slug || event.id,
        event.platform === PredictionPlatform.Opinion
            ? {
                  multiple: !event.isSingleEvent,
              }
            : undefined,
    );
}
