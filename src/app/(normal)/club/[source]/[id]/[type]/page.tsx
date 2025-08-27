import type { Metadata } from 'next';

import { ChannelContentList } from '@/components/Channel/ChannelContentList.js';
import { ChannelProvider } from '@/components/Channel/ChannelProvider.js';
import { NoSSR } from '@/components/NoSSR.js';
import { ChannelTabType, type SocialSourceInURL, Source, SourceInURL } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { FireflyMetadataProvider } from '@/providers/firefly/Metadata.js';
import type { NextPageProps } from '@/types/utility.js';

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
    const { source = SourceInURL.Farcaster, id } = await props.params;
    return FireflyMetadataProvider.createChannelMetadata(source, id, `/club/${source}/${id}`);
}

export default async function Page(props: Props) {
    await setupLocaleForSSR();

    const { source, id, type } = await props.params;
    const resolvedSource = resolveSocialSource(source);

    if (resolvedSource === Source.Lens && !isValidAddressEthereum(id)) notFound();

    const provider = resolveSocialMediaProvider(resolvedSource);
    const channel = await runInSafeAsync(() => provider.getChannelById(id));

    if (!channel) notFound();

    return (
        <NoSSR>
            <ChannelProvider channel={channel}>
                <ChannelContentList type={type} channel={channel} />
            </ChannelProvider>
        </NoSSR>
    );
}
