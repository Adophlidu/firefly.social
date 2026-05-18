import { Source } from '@dimensiondev/enums';
import { shuffle } from 'lodash-es';

import type { TransactionsItem } from '@/providers/types/Firefly.js';

export function shuffleTransactions(list: TransactionsItem[]) {
    const count = Math.floor(Math.random() * 3 + 1); // [1, 3]
    const preferredSwaps: TransactionsItem[] = [];
    const others: TransactionsItem[] = [];

    list.forEach((item) => {
        if (preferredSwaps.length < count && item.source === Source.Swap) {
            preferredSwaps.push(item);
        } else {
            others.push(item);
        }
    });

    return preferredSwaps.concat(shuffle(others));
}
