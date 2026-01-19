import { msg } from '@lingui/core/macro';

import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<{
        id: string;
    }> {}

export async function generateMetadata(props: Props) {
    const { id } = await props.params;

    return createSiteMetadata(`/polymarket/event/${id}`, {
        title: await createPageTitleSSR(msg`Polymarket Event`),
    });
}

export default async function PolymarketEventLayout(props: Props) {
    return props.children;
}
