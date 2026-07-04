import { PredictionPlatform } from '@dimensiondev/enums';
import type { LayoutProps, SearchProps } from '@dimensiondev/types';
import type { Metadata } from 'next';

import { getPolymarketEventPageMetadata } from '@/app/[locale]/(normal)/polymarket/event/[id]/getPolymarketEventPageData.js';

interface MetadataProps extends LayoutProps<{ id: string; locale: string }>, SearchProps<{ type: 'multi' | string }> {}

type LayoutPropsOnly = LayoutProps<{ id: string; locale: string }>;

export async function generateMetadata(props: MetadataProps): Promise<Metadata> {
    const [{ id, locale }, searchParams] = await Promise.all([props.params, props.searchParams]);
    const type = searchParams.type;
    const isMutil = type === 'multi';

    return getPolymarketEventPageMetadata({
        id,
        isMutil,
        locale,
        platform: PredictionPlatform.Polymarket,
        pathname: `/polymarket/event/${id}`,
        type,
    });
}

export default async function PolymarketEventLayout(props: LayoutPropsOnly) {
    return props.children;
}
