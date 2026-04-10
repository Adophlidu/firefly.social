import { runInSafeAsync } from '@dimensiondev/utils';

import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { type EventId } from '@/providers/types/Telemetry.js';

export function captureArticleCollectEvent(
    eventId: EventId.ARTICLE_COLLECT_SUBMIT | EventId.ARTICLE_COLLECT_SUCCESS,
    articleId: string,
    address: string,
    freeMint: boolean,
) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(eventId, {
            ...getWalletEventParameters(address),
            free_mint: freeMint,
            article_id: articleId,
        });
    });
}
