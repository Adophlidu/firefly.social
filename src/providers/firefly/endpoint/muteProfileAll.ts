import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import { getPlatformQueryKey } from '@/helpers/getPlatformQueryKey.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type FireflyIdentity, type MuteAllResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function muteProfileAll(identity: FireflyIdentity) {
    if (identity.source === Source.Bsky) return;
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/muteAll', {
        [getPlatformQueryKey(identity.source)]: identity.id,
    });

    await fireflySessionHolder.fetch<MuteAllResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            [getPlatformQueryKey(identity.source)]: identity.id,
        }),
    });
}
