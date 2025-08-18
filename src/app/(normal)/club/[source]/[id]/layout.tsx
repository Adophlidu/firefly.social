import type { Metadata } from 'next';

import { ChannelInfoUI } from '@/components/Channel/ChannelInfoUI.js';
import { Title } from '@/components/Channel/Title.js';
import { KeyType, type SocialSourceInURL, SourceInURL } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { createMetadataChannelById } from '@/helpers/createMetadataChannel.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<{
        id: string;
        source: SocialSourceInURL;
    }> {}

const createPageMetadata = memoizeWithRedis(createMetadataChannelById, {
    key: KeyType.CreateMetadataChannelById,
});

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { source = SourceInURL.Farcaster, id } = await props.params;
    return createPageMetadata(`/club/${source}/${id}`, source, id);
}

export default async function Page(props: Props) {
    await setupLocaleForSSR();

    const { source, id } = await props.params;
    const resolvedSource = resolveSocialSource(source);

    const provider = resolveSocialMediaProvider(resolvedSource);
    const channel = await runInSafeAsync(() => provider.getChannelById(id));
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
