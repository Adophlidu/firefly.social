import { type LoaderContext, notFound, redirect } from '@dimensiondev/ssr';

import { isSocialSource } from '@/helpers/isSource.js';
import { resolveChannelUrl } from '@/helpers/resolveChannelUrl.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';

export const config = { cache: { sMaxAge: 300 } };

export function loader({ params }: LoaderContext): void {
    const id = params.id;
    const source = resolveSourceFromUrlNoFallback(params.source!);
    if (!id || !source || !isSocialSource(source)) notFound();
    redirect(resolveChannelUrl(id, source), 307);
}

export default function ClubRedirectPage() {
    return null;
}
