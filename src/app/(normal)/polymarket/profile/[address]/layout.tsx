import type { NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<{
        address: string;
    }> {}

export default async function PolymarketProfileLayout(props: Props) {
    return <div>{props.children}</div>;
}
