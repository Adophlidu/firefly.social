import type { SocialSource } from '@dimensiondev/enums';
import { EngagementType } from '@dimensiondev/enums';
import { type LoaderContext, notFound, useLoaderData } from '@dimensiondev/ssr';
import type { ReactNode } from 'react';

import { EngagementLayout } from '@/app/[locale]/(normal)/post/[source]/[id]/pages/EngagementLayout.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { isEngagementType } from '@/helpers/parseEngagementUrl.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';

interface EngagementLayoutData {
    source: SocialSource;
    id: string;
    type: EngagementType;
}

export async function loader({ params }: LoaderContext): Promise<EngagementLayoutData> {
    const source = resolveSourceFromUrlNoFallback(params.source!);
    if (!source || !isSocialSource(source)) notFound();

    const type = params.type!;
    if (!isEngagementType(type)) notFound();

    return { source, id: params.id!, type };
}

/**
 * Port of the Next post engagement layout
 * (src/app/[locale]/(normal)/post/[source]/[id]/[type]/layout.tsx): validates
 * source/type in the loader, then renders the engagement tabs around the list.
 */
export default function PostEngagementLayout({ children }: { children?: ReactNode }) {
    const { source, id, type } = useLoaderData<EngagementLayoutData>('post/$source/$id/$type/_layout.tsx');
    return (
        <EngagementLayout source={source} id={id} type={type}>
            {children}
        </EngagementLayout>
    );
}
