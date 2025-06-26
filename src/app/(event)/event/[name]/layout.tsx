import { ActivityProvider } from '@/components/Activity/ActivityContext.js';
import { KeyType } from '@/constants/enum.js';
import { createMetadataEventDetailPage } from '@/helpers/createMetadataEventDetailPage.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ name: string }> {}

const createPageMetadata = memoizeWithRedis(createMetadataEventDetailPage, {
    key: KeyType.CreateMetadataEvent,
});

export async function generateMetadata(props: Props) {
    const { name } = await props.params;
    return createPageMetadata(`/event/${name}`, name);
}

export default async function Layout(props: Props) {
    await setupLocaleForSSR();

    const { children } = props;

    const { name } = await props.params;
    return <ActivityProvider name={name}>{children}</ActivityProvider>;
}
