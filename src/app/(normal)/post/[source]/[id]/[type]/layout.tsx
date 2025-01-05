import { notFound } from 'next/navigation.js';

import { EngagementLayout } from '@/app/(normal)/post/[source]/[id]/pages/EngagementLayout.js';
import type { EngagementType } from '@/constants/enum.js';
import { isSocialSource } from '@/helpers/isSocialSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ source: string; id: string; type: EngagementType }> {}

export default async function Layout(props: Props) {
    const params = await props.params;
    const { children } = props;

    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isSocialSource(source)) notFound();
    return (
        <EngagementLayout source={source} id={params.id} type={params.type}>
            {children}
        </EngagementLayout>
    );
}
