import PolymarketProfilePositionsPage from '@/app/(normal)/polymarket/profile/[address]/positions/page.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<{
        address: string;
    }> {}

export default async function PolymarketProfilePage(props: Props) {
    return <PolymarketProfilePositionsPage {...props} />;
}
