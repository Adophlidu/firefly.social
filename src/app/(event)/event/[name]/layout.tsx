import { ActivityProvider } from '@/components/Activity/ActivityContext.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { FireflyMetadataProvider } from '@/providers/firefly/Metadata.js';
import type { NextPageProps } from '@/types/utility.js';
import type { Metadata } from 'next';

interface Props extends NextPageProps<{ name: string }> {}

export default async function Layout(props: Props) {
    await setupLocaleForSSR();

    const { children } = props;

    const { name } = await props.params;
    return <ActivityProvider name={name}>{children}</ActivityProvider>;
}
