import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Account } from '@/providers/types/Account.js';
import type { ReportLensResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function reportLensAccount({ session, profile }: Account, signal?: AbortSignal) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/lens/report');
    const response = await fireflySessionHolder.fetchWithoutSession<ReportLensResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            accessToken: session.token,
            ProfileId: profile.profileId,
            HandlesName: profile.handle,
            LensAddress: profile.ownedBy?.address || profile.profileId,
        }),
        signal,
    });
    return resolveFireflyResponseData(response);
}
