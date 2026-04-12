import type { LayoutProps } from '@dimensiondev/types';
import { createLookupTableResolver } from '@dimensiondev/utils';
import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import type { ReactNode } from 'react';

import { MuteType, Source, SourceInURL } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';

export function generateStaticParams() {
    return [
        { source: SourceInURL.Farcaster, type: MuteType.Profile },
        { source: SourceInURL.Farcaster, type: MuteType.Channel },
        { source: SourceInURL.Lens, type: MuteType.Profile },
        { source: SourceInURL.X, type: MuteType.Profile },
        { source: SourceInURL.Firefly, type: MuteType.Wallet },
        { source: SourceInURL.Bsky, type: MuteType.Profile },
    ];
}

const resolveMuteTitle = createLookupTableResolver<string, MessageDescriptor>(
    {
        [`${SourceInURL.Farcaster}_${MuteType.Profile}`]: msg`${resolveSourceName(Source.Farcaster)} muted users`,
        [`${SourceInURL.Farcaster}_${MuteType.Channel}`]: msg`${resolveSourceName(Source.Farcaster)} muted channels`,
        [`${SourceInURL.Lens}_${MuteType.Profile}`]: msg`${resolveSourceName(Source.Lens)} muted users`,
        [`${SourceInURL.X}_${MuteType.Profile}`]: msg`${resolveSourceName(Source.Twitter)} muted users`,
        [`${SourceInURL.Firefly}_${MuteType.Wallet}`]: msg`Muted wallets`,
        [`${SourceInURL.Bsky}_${MuteType.Profile}`]: msg`${resolveSourceName(Source.Bsky)} muted users`,
    },
    msg`Unknown`,
);

interface Props
    extends LayoutProps<{
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
    return <>{children}</>;
}
