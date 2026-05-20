'use client';

import type { LayoutProps } from '@dimensiondev/types';
import { use } from 'react';

import { PredictionCategoryPage } from '@/components/Prediction/Category/PredictionCategoryPage.js';

interface Props extends LayoutProps<{ slug: string }> {}

export default function Page(props: Props) {
    const { slug } = use(props.params);
    return <PredictionCategoryPage slug={slug} />;
}
