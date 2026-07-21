import { type HeadContext, type LoaderContext, notFound, redirect } from '@dimensiondev/ssr';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { getProfilePageMetadata } from '@/providers/firefly/metadata/getProfilePageMetadata.js';

export function loader({ params }: LoaderContext): void {
    const { source, id } = params;
    const resolvedSource = resolveSourceFromUrlNoFallback(source!);
    if (!resolvedSource || !isProfilePageSource(resolvedSource)) notFound();
    redirect(getProfileUrl({ source: resolvedSource, profileId: id!, handle: id! }), 307);
}

export function head({ params }: HeadContext) {
    const { source, id } = params;
    const resolvedSource = resolveSourceFromUrlNoFallback(source ?? '');
    if (resolvedSource && isProfilePageSource(resolvedSource)) {
        return getProfilePageMetadata(source ?? '', id ?? '', `/profile/${source}/${id}`);
    }
    return createSiteMetadata(`/profile/${source}/${id}`);
}

export default function ProfileIdPage() {
    return null;
}
