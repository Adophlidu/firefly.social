import { ActivityProvider } from '@/components/Activity/ActivityContext.js';
import { KeyType } from '@/constants/enum.js';
import { createMetadataEventDetailPage } from '@/helpers/createMetadataEventDetailPage.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/index.js';

const createPageMetadata = memoizeWithRedis(createMetadataEventDetailPage, {
    key: KeyType.CreateMetadataEvent,
});

interface Props extends NextPageProps<{ name: string }> {}

export async function generateMetadata(props: Props) {
    const params = await props.params;
    return createPageMetadata(params.name);
}

export default async function Layout(props: Props) {
    await setupLocaleForSSR();

    const { children } = props;
    const params = await props.params;

    return <ActivityProvider name={params.name}>{children}</ActivityProvider>;
}
