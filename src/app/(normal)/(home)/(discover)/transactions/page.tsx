import { NoSSR } from '@/components/NoSSR.js';
import { ForYouTransactions } from '@/components/Transactions/ForYouTransactions.js';

export default function Page() {
    return (
        <NoSSR>
            <ForYouTransactions />
        </NoSSR>
    );
}
