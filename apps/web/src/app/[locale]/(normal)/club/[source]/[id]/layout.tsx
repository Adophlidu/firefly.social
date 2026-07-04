import type { SocialSourceInURL } from '@dimensiondev/enums';
import { SourceInURL } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import type { Metadata } from 'next';

import {
    getChannelPageData,
    getChannelPageMetadata,
} from '@/app/[locale]/(normal)/club/[source]/[id]/getChannelPageData.js';
import { ChannelInfoUI } from '@/components/Channel/ChannelInfoUI.js';
import { Title } from '@/components/Channel/Title.js';
import { notFound } from '@/esm/navigation/server.js';

type Props = LayoutProps<{
    id: string;
    source: string;
}>;

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { source = SourceInURL.Farcaster, id } = await props.params;
    return getChannelPageMetadata(source as SocialSourceInURL, id, `/club/${source}/${id}`);
}

export default async function Page(props: Props) {
    const { id } = await props.params;
    const source = (await props.params).source as SocialSourceInURL;

    const channel = await getChannelPageData(source, id);
    if (!channel) notFound();

    return (
        <>
            <Title channel={channel} />
            <ChannelInfoUI channel={channel} source={channel.source} isChannelPage />
            <hr className="divider w-full border-line" />
            {props.children}
        </>
    );
}
