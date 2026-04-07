import { type LayoutProps } from '@dimensiondev/types';
import { type Metadata } from 'next';

import { ChannelInfoUI } from '@/components/Channel/ChannelInfoUI.js';
import { Title } from '@/components/Channel/Title.js';
import { type SocialSourceInURL, SourceInURL } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { createChannelMetadata } from '@/providers/firefly/metadata/createChannelMetadata.js';

interface Props
    extends LayoutProps<{
        id: string;
        source: SocialSourceInURL;
    }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { source = SourceInURL.Farcaster, id } = await props.params;
    return createChannelMetadata(source, id, `/club/${source}/${id}`);
}

export default async function Page(props: Props) {
    const { source, id } = await props.params;
    const resolvedSource = resolveSocialSource(source);

    const provider = resolveSocialMediaProvider(resolvedSource);
    const channel = await runInSafeAsync(() => provider.getChannelById(id));
    if (!channel) notFound();

    return (
        <>
            <Title channel={channel} />
            <ChannelInfoUI channel={channel} source={channel.source} isChannelPage />
            <hr className="divider border-line w-full" />
            {props.children}
        </>
    );
}
