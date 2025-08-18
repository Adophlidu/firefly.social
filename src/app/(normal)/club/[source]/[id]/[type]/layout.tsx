import type { Metadata } from 'next';

import { ChannelTabs } from '@/components/Channel/ChannelTabs.js';
import { ChannelTabType, KeyType, type SocialSourceInURL, SourceInURL } from '@/constants/enum.js';
import { CHANNEL_TAB_TYPE } from '@/constants/index.js';
import { notFound } from '@/esm/navigation/server.js';
import { createMetadataChannelById } from '@/helpers/createMetadataChannel.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/utility.js';

const createPageMetadata = memoizeWithRedis(createMetadataChannelById, {
    key: KeyType.CreateMetadataChannelById,
});

interface Props
    extends NextPageProps<
        {
            id: string;
            source?: SocialSourceInURL;
            type?: ChannelTabType;
        },
        {
            source: SocialSourceInURL;
        }
    > {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { source = SourceInURL.Farcaster, id, type = ChannelTabType.Posts } = await props.params;
    return createPageMetadata(`/club/${source}/${id}/${type}`, source, id);
}

export default async function Layout(props: Props) {
    await setupLocaleForSSR();

    const { source = SourceInURL.Farcaster, id, type = ChannelTabType.Posts } = await props.params;
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
