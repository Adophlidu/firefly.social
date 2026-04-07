import { type ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers.js';
import { headers } from 'next/headers.js';

import { Agent } from '@/constants/enum.js';

export async function getAgent(allHeaders?: ReadonlyHeaders) {
    const url = (allHeaders ?? (await headers())).get('X-URL');
    if (!url) return null;

    const parsedUrl = new URL(url);
    const agent = parsedUrl.searchParams.get('agent') as Agent | null;
    if (agent) return agent;

    // the /frame only used in firefly app
    if (parsedUrl.pathname.startsWith('/frame')) return Agent.FireflyApp;
    return null;
}
