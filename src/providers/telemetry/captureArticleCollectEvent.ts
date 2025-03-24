import { resolveCurrentFireflyAccountId } from '@/helpers/resolveFireflyProfileId.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function captureArticleCollectEvent(articleId: string, address: string, freeMint: boolean) {
    return runInSafeAsync(async () => {
        const accountId = await resolveCurrentFireflyAccountId();
        return TelemetryProvider.captureEvent(EventId.ARTICLE_COLLECT_SUCCESS, {
            ...getWalletEventParameters(address),
            free_mint: freeMint,
            article_id: articleId,
            firefly_account_id: accountId,
        });
    });
}
