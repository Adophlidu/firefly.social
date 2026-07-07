import type { LayoutProps } from '@dimensiondev/types';

import { getPredictionCategoryPageData } from '@/app/[locale]/(normal)/prediction/category/[...slugs]/getPredictionCategoryPageData.js';
import { PredictionCategoryPage } from '@/components/Prediction/Category/PredictionCategoryPage.js';

interface Props extends LayoutProps<{ slugs: string[]; locale: string }> {}

export const revalidate = 60;

// Static-class stub: with no build-time params, every path is rendered on demand
// and cached per `revalidate` (routes without generateStaticParams are forced dynamic).
export function generateStaticParams() {
    return [];
}

export default async function Page({ params }: Props) {
    const { slugs, locale } = await params;
    const { slugList, initialPropsListPage } = await getPredictionCategoryPageData(slugs, locale);

    return <PredictionCategoryPage slugs={slugs} slugList={slugList} initialPropsListPage={initialPropsListPage} />;
}
