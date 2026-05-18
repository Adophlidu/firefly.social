import type { SocialSourceInURL } from '@dimensiondev/enums';
import { SourceInURL } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { runInSafeAsync } from '@dimensiondev/utils';
import type { Metadata } from 'next';

import { ChannelInfoUI } from '@/components/Channel/ChannelInfoUI.js';
import { Title } from '@/components/Channel/Title.js';
import { notFound } from '@/esm/navigation/server.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { createChannelMetadata } from '@/providers/firefly/metadata/createChannelMetadata.js';

type Props = LayoutProps<{
    id: string;
    source: string;
}>;

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { source = SourceInURL.Farcaster, id } = await props.params;
    return createChannelMetadata(source, id, `/club/${source}/${id}`);
}

export default async function Page(props: Props) {
    const { id } = await props.params;
    const source = (await props.params).source as SocialSourceInURL;
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
