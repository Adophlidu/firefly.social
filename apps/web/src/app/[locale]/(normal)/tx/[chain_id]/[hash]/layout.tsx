import type { LayoutProps } from '@dimensiondev/types';

type Props = LayoutProps<{ hash: string; chain_id: string }>;

export default async function TxPageLayout(props: Props) {
    return <>{props.children}</>;
}
