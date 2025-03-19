import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function captureArticleCollectEvent(address: string) {
    return runInSafeAsync(() => {
        return TelemetryProvider.captureEvent(EventId.ARTICLE_COLLECT_SUCCESS, getWalletEventParameters(address));
    });
}
