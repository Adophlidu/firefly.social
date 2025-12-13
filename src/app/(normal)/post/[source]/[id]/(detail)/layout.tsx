import { Trans } from '@lingui/react/macro';
import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

import { Comeback } from '@/components/Comeback.js';
import type { SocialSourceInURL } from '@/constants/enum.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { createPostMetadata } from '@/providers/firefly/metadata/createPostMetadata.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ id: string; source: SocialSourceInURL }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { source, id } = await props.params;
    return isSocialSourceInUrl(source)
        ? createPostMetadata(source, id, `/post/${source}/${id}`)
        : createSiteMetadata(`/post/${source}/${id}`);
}

export default async function Layout({ children }: PropsWithChildren) {
    await setupLocaleForSSR();

    return (
        <>
            <header className="sticky top-0 z-40 flex items-center border-b border-line bg-primaryBottom px-4 py-[18px]">
                <Comeback className="mr-8" />
                <h2 className="text-xl font-black leading-6">
                    <Trans>Details</Trans>
                </h2>
            </header>
            {children}
        </>
    );
}
