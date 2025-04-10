import { t } from '@lingui/core/macro';

import { GroupDetails } from '@/app/(normal)/group/[id]/[type]/pages/GroupDetails.js';
import type { GroupTabType } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ id: string; type: GroupTabType }> {}

export async function generateMetadata() {
    return createSiteMetadata({
        title: await createPageTitleSSR(() => t`Group`),
    });
}

export default async function DetailLayout(props: Props) {
    await setupLocaleForSSR();
    const param = await props.params;

    return (
        <GroupDetails id={param.id} type={param.type}>
            {props.children}
        </GroupDetails>
    );
}
