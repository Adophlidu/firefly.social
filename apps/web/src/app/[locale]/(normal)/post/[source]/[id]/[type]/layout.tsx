import type { LayoutProps } from '@dimensiondev/types';

import { EngagementLayout } from '@/app/[locale]/(normal)/post/[source]/[id]/pages/EngagementLayout.js';
import { notFound } from '@/esm/navigation/server.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { isEngagementType } from '@/helpers/parseEngagementUrl.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';

export const revalidate = 300;

// Static-class stub: with no build-time params, every path is rendered on demand
// and cached per `revalidate` (routes without generateStaticParams are forced dynamic).
export function generateStaticParams() {
    return [];
}

interface Props extends LayoutProps<{ source: string; id: string; type: string }> {}

export default async function Layout(props: Props) {
    const params = await props.params;

    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isSocialSource(source)) notFound();

    if (!isEngagementType(params.type)) notFound();

    return (
        <EngagementLayout source={source} id={params.id} type={params.type}>
            {props.children}
        </EngagementLayout>
    );
}
