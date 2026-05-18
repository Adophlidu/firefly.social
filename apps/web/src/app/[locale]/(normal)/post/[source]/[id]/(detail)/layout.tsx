import { SourceInURL } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { Trans } from '@lingui/react/macro';
import type { Metadata } from 'next';

import { Comeback } from '@/components/Comeback.js';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { setupLocaleFromParams } from '@/i18n/static.js';
import { createPostMetadata } from '@/providers/firefly/metadata/createPostMetadata.js';

interface Props extends LayoutProps<{ id: string; source: string; locale: string }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { source, id } = await props.params;
    const typedSource = source as SourceInURL;

    return isSocialSourceInUrl(typedSource)
        ? createPostMetadata(typedSource, id, `/post/${source}/${id}`)
        : createSiteMetadata(`/post/${source}/${id}`);
}

export default async function Layout(props: Props) {
    const params = await props.params;
    setupLocaleFromParams(params.locale);

    return (
        <>
            <header className="border-line bg-primaryBottom sticky top-0 z-40 flex items-center border-b px-4 py-[18px]">
                <Comeback className="mr-8" />
                <h2 className="text-xl font-black leading-6">
                    <Trans>Details</Trans>
                </h2>
            </header>
            {props.children}
        </>
    );
}
