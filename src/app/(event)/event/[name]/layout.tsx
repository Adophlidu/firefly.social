import { ActivityProvider } from '@/components/Activity/ActivityContext.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { FireflyMetadataProvider } from '@/providers/firefly/Metadata.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ name: string }> {}

export async function generateMetadata(props: Props) {
    const { name } = await props.params;
    return FireflyMetadataProvider.createEventMetadata(name, `/event/${name}`);
}

export default async function Layout(props: Props) {
    await setupLocaleForSSR();

    const { children } = props;

    const { name } = await props.params;
    return <ActivityProvider name={name}>{children}</ActivityProvider>;
}
