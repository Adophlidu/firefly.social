import { type PropsWithChildren } from 'react';

import { type TipsDetailViewType } from '@/constants/enum.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { type LayoutProps } from '@/types/utility.js';

interface Props
    extends PropsWithChildren<LayoutProps<{ hash: string; chain_id: string }, { view?: TipsDetailViewType }>> {}

export default async function TxPageLayout(props: Props) {
    await setupLocaleForSSR();

    return <>{props.children}</>;
}
