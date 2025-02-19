import { notFound, redirect, RedirectType } from 'next/navigation.js';
import type { NextRequest } from 'next/server.js';

import { isProfilePageSource } from '@/helpers/isProfilePageSource.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import type { NextRequestContext } from '@/types/index.js';

export async function GET(request: NextRequest, context: NextRequestContext) {
    const params = await context.params;
    const id = params.id;
    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isProfilePageSource(source)) notFound();
    redirect(resolveProfileUrl(source, id), RedirectType.replace);
}
