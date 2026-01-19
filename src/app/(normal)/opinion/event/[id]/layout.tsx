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

    return createSiteMetadata(`/opinion/event/${id}`, {
        title: await createPageTitleSSR(msg`Opinion Event`),
    });
}

export default async function OpinionEventLayout(props: Props) {
    return props.children;
}
