import type { LayoutProps } from '@dimensiondev/types';

import { PredictionCategoryPage } from '@/components/Prediction/Category/PredictionCategoryPage.js';

interface Props extends LayoutProps<{ slugs: string[] }> {}

export default async function Page({ params }: Props) {
    const { slugs } = await params;
    return <PredictionCategoryPage slugs={slugs} />;
}
