import type { Metadata } from 'next';

import { ChannelInfoUI } from '@/components/Channel/ChannelInfoUI.js';
import { ChannelProvider } from '@/components/Channel/ChannelProvider.js';
import { PostList } from '@/components/Channel/PostList.js';
import { Title } from '@/components/Channel/Title.js';
import { NoSSR } from '@/components/NoSSR.js';
import { ChannelTabType, KeyType, type SocialSourceInURL, SourceInURL } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation.js';
import { createMetadataChannelById } from '@/helpers/createMetadataChannel.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
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
        },
        {
            source: SocialSourceInURL;
            channel_tab?: ChannelTabType;
        }
    > {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const params = await props.params;
    return createPageMetadata(params.source || SourceInURL.Farcaster, params.id);
}

export default async function Page(props: Props) {
    await setupLocaleForSSR();

    const params = await props.params;
    const source = resolveSocialSource(params.source);
    const provider = resolveSocialMediaProvider(source);
    const channel = await runInSafeAsync(() => provider.getChannelById(params.id));

    if (!channel) notFound();

    return (
        <>
            <Title channel={channel} />
            <ChannelInfoUI channel={channel} source={channel.source} isChannelPage />
            <hr className="divider w-full border-line" />
            <NoSSR>
                <ChannelProvider channel={channel}>
                    <PostList source={source} channel={channel} />
                </ChannelProvider>
            </NoSSR>
        </>
    );
}
