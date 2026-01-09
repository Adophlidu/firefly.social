import { msg } from '@lingui/core/macro';

import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { type NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<{
        address: string;
    }> {}

export async function generateMetadata(props: Props) {
    const { address } = await props.params;

    return createSiteMetadata(`/opinion/profile/${address}`, {
        title: await createPageTitleSSR(msg`Opinion Profile`),
    });
}

export default async function OpinionProfileLayout(props: Props) {
    return props.children;
}
