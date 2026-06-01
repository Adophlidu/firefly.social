import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { ParseOptions, ParseResponse } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function parse(options: ParseOptions) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/misc/redpacket/parse');
    const { data } = await fireflySessionHolder.fetch<ParseResponse>(url, {
        method: 'POST',
        body: JSON.stringify(options),
    });
    return data;
}
