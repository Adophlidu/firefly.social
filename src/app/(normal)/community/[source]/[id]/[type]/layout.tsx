import type { Metadata } from 'next';

import { ChannelTabs } from '@/components/Channel/ChannelTabs.js';
import { ChannelTabType, KeyType, type SocialSourceInURL, SourceInURL } from '@/constants/enum.js';
import { CHANNEL_TAB_TYPE } from '@/constants/index.js';
import { notFound } from '@/esm/navigation/server.js';
import { createMetadataChannelById } from '@/helpers/createMetadataChannel.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/index.js';

const createPageMetadata = memoizeWithRedis(createMetadataChannelById, {
    key: KeyType.CreateMetadataChannelById,
});

interface Props
    extends NextPageProps<
        {
            id: string;
            source: SocialSourceInURL;
            type: ChannelTabType;
        },
        {
            source: SocialSourceInURL;
        }
    > {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const params = await props.params;
    return createPageMetadata(params.source || SourceInURL.Farcaster, params.id);
}

export default async function Layout(props: Props) {
    await setupLocaleForSSR();

    const params = await props.params;
    const source = resolveSocialSource(params.source);

    const validTypes = CHANNEL_TAB_TYPE[source];
    if (!validTypes.includes(params.type)) notFound();

    return (
        <>
            <ChannelTabs channelId={params.id} source={source} currentTab={params.type} />
            {props.children}
        </>
    );
}
