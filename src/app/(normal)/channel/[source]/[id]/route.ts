import type { NextRequest } from 'next/server.js';

import { Source } from '@/constants/enum.js';
import { notFound, redirect, RedirectType } from '@/esm/navigation.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { resolveChannelUrl } from '@/helpers/resolveChannelUrl.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import type { NextRequestContext } from '@/types/index.js';

export async function GET(request: NextRequest, context: NextRequestContext) {
    const params = await context.params;
    const id = params.id;
    const source = narrowToSocialSource(resolveSourceFromUrlNoFallback(params.source) || Source.Farcaster);
    if (!source || !id) notFound();

    redirect(resolveChannelUrl(id, source), RedirectType.replace);
}
