/* eslint-disable react-hooks/rules-of-hooks -- slot exports are components, but named after the slot (lowercase) they fill */
import type { SocialSourceInURL } from '@dimensiondev/enums';
import { SourceInURL } from '@dimensiondev/enums';
import { type LoaderContext, notFound, useLoaderData } from '@dimensiondev/ssr';
import type { ReactNode } from 'react';

import { ChannelInfoUI } from '@/components/Channel/ChannelInfoUI.js';
import { Title } from '@/components/Channel/Title.js';
import { getChannelPageData } from '@/providers/firefly/metadata/getChannelPageData.js';

interface ClubLayoutData {
    channel: NonNullable<Awaited<ReturnType<typeof getChannelPageData>>>;
}

export async function loader({ params }: LoaderContext): Promise<ClubLayoutData> {
    const source = (params.source ?? SourceInURL.Farcaster) as SocialSourceInURL;

    const channel = await getChannelPageData(source, params.id!);
    if (!channel) notFound();

    return { channel };
}

/**
 * Port of the Next club layout
 * (src/app/[locale]/(normal)/club/[source]/[id]/layout.tsx):
 * channel header + info card above every club tab page.
 */
export default function ClubLayout({ children }: { children?: ReactNode }) {
    const { channel } = useLoaderData<ClubLayoutData>('club/$source/$id/_layout.tsx');

    return (
        <>
            <Title channel={channel} />
            <ChannelInfoUI channel={channel} source={channel.source} isChannelPage />
            <hr className="divider w-full border-line" />
            {children}
        </>
    );
}
