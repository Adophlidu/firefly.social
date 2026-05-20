import type { LayoutProps } from '@dimensiondev/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Prediction Category',
};

export default function PredictionCategoryLayout(props: LayoutProps) {
    return props.children;
}
