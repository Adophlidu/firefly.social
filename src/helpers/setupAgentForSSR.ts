import { getEnumAsArray } from '@masknet/kit';

import { Agent, PageRoute, SiteCookies } from '@/constants/enum.js';
import { redirect, RedirectType } from '@/esm/navigation/server.js';
import { getCookie } from '@/helpers/getCookies.js';

export async function setupAgentForSSR(route = PageRoute.Home) {
    const agent = await getCookie(SiteCookies.Agent);

    // validate agent
    if (agent && getEnumAsArray(Agent).some((x) => x.value === agent)) return agent;

    redirect(`/redirect/agent?url=${route}`, RedirectType.replace);
}
