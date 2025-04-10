import { getEnumAsArray } from '@masknet/kit';
import { redirect, RedirectType } from '@/esm/navigation.js';

import { Agent, PageRoute } from '@/constants/enum.js';
import { getCookieAsync } from '@/helpers/getCookie.js';

export async function setupAgentForSSR(route = PageRoute.Home) {
    const agent = await getCookieAsync('agent');

    // validate agent
    if (agent && getEnumAsArray(Agent).some((x) => x.value === agent)) return agent;

    redirect(`/redirect/agent?url=${route}`, RedirectType.replace);
}
