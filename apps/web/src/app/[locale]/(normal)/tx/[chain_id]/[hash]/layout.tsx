import { type PropsWithChildren } from 'react';

import { type TipsDetailViewType } from '@/constants/enum.js';
import { type LayoutProps } from '@/types/utility.js';

interface Props
    extends PropsWithChildren<LayoutProps<{ hash: string; chain_id: string }, { view?: TipsDetailViewType }>> {}

export default async function TxPageLayout(props: Props) {
    return <>{props.children}</>;
}
