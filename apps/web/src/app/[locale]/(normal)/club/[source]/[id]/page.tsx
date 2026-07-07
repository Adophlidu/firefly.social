import type { SocialSourceInURL } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';

import { notFound, redirect, RedirectType } from '@/esm/navigation/server.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveChannelUrl } from '@/helpers/resolveChannelUrl.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';

export const revalidate = 300;

// Static-class stub: with no build-time params, every path is rendered on demand
// and cached per `revalidate` (routes without generateStaticParams are forced dynamic).
export function generateStaticParams() {
    return [];
}

interface Props extends LayoutProps<{
    id: string;
    source: SocialSourceInURL;
}> {}

export default async function Page(props: Props) {
    const params = await props.params;
    const id = params.id;
    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!id || !source || !isSocialSource(source)) notFound();

    redirect(resolveChannelUrl(id, source), RedirectType.replace);
}
