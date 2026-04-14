import type { LayoutProps } from '@dimensiondev/types';
import type { Metadata } from 'next';

import { ChannelTabs } from '@/components/Channel/ChannelTabs.js';
import { CHANNEL_TAB_TYPE } from '@/constants/computed.js';
import { ChannelTabType, type SocialSourceInURL, SourceInURL } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { createChannelMetadata } from '@/providers/firefly/metadata/createChannelMetadata.js';

type Props = LayoutProps<{
    id: string;
    source?: string;
    type?: string;
}>;

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { source = SourceInURL.Farcaster, id, type = ChannelTabType.Posts } = await props.params;
    return createChannelMetadata(source, id, `/club/${source}/${id}/${type}`);
}

export default async function Layout(props: Props) {
    const source = ((await props.params).source as SocialSourceInURL) || SourceInURL.Farcaster;
    const { id } = await props.params;
    const type = ((await props.params).type as ChannelTabType) || ChannelTabType.Posts;
    const resolvedSource = resolveSocialSource(source);

    const validTypes = CHANNEL_TAB_TYPE[resolvedSource];
    if (!validTypes.includes(type)) notFound();

    return (
        <>
            <ChannelTabs channelId={id} source={resolvedSource} currentTab={type} />
            {props.children}
        </>
    );
}
