import { NoSSR } from '@/components/NoSSR.js';
import { FollowingTransactions } from '@/components/Transactions/FollowingTransactions.js';

export default function TransactionsPage() {
    return (
        <NoSSR>
            <FollowingTransactions />
        </NoSSR>
    );
}
