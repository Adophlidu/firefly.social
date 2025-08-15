import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

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
