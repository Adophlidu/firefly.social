import type { LayoutProps } from '@dimensiondev/types';

import { PredictionCategoryPage } from '@/components/Prediction/Category/PredictionCategoryPage.js';

interface Props extends LayoutProps<{ slug: string }> {}

export default async function Page({ params }: Props) {
    const { slug } = await params;
    return <PredictionCategoryPage slug={slug} />;
}
