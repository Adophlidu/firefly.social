import { Agent, PageRoute, SiteCookies } from '@/constants/enum.js';
import { redirect, RedirectType } from '@/esm/navigation/server.js';
import { getCookie } from '@/helpers/getCookies.js';
import { isValidEnumValue } from '@/helpers/isValidEnumValue.js';

export async function setupAgentForSSR(route = PageRoute.Home) {
    const agent = await getCookie(SiteCookies.Agent);
    if (agent && isValidEnumValue(agent, Agent)) return agent;

    redirect(`/redirect/agent?url=${route}`, RedirectType.replace);
}
