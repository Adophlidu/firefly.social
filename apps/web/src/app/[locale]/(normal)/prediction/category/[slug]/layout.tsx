import type { LayoutProps } from '@dimensiondev/types';
import { msg } from '@lingui/core/macro';

import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export async function generateMetadata() {
    return createSiteMetadata('/prediction/category', {
        title: await createPageTitleSSR(msg`Predictions`),
    });
}

export default function PredictionCategoryLayout(props: LayoutProps<{}>) {
    return props.children;
}
