import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { type ReactNode } from 'react';

import { MuteType, Source, SourceInURL } from '@/constants/enum.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/index.js';

const resolveMuteTitle = createLookupTableResolver<string, MessageDescriptor>(
    {
        [`${SourceInURL.Farcaster}_${MuteType.Profile}`]: msg`${resolveSourceName(Source.Farcaster)} Users`,
        [`${SourceInURL.Farcaster}_${MuteType.Channel}`]: msg`${resolveSourceName(Source.Farcaster)} Channels`,
        [`${SourceInURL.Lens}_${MuteType.Profile}`]: msg`${resolveSourceName(Source.Lens)} Users`,
        [`${SourceInURL.X}_${MuteType.Profile}`]: msg`${resolveSourceName(Source.Twitter)} Users`,
        [`${SourceInURL.Firefly}_${MuteType.Wallet}`]: msg`Wallets`,
        [`${SourceInURL.Bsky}_${MuteType.Profile}`]: msg`${resolveSourceName(Source.Bsky)} Users`,
    },
    msg`Unknown`,
);

interface Props
    extends NextPageProps<{
        source: SourceInURL;
        type: MuteType;
    }> {}

export async function generateMetadata(props: Props) {
    const { source, type } = await props.params;

    return createSiteMetadata(`/settings/mutes/${source}/${type}`, {
        title: await createPageTitleSSR(resolveMuteTitle(`${source}_${type}`)),
    });
}

export default async function Layout({ children }: { children: ReactNode }) {
    await setupLocaleForSSR();
    return <>{children}</>;
}
