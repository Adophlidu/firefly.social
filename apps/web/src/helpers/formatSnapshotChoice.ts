import { t } from '@lingui/core/macro';
import { sum, values } from 'lodash-es';

import { type SnapshotChoice } from '@/providers/snapshot/type.js';

function ordinal_suffix_of(i: number) {
    const j = i % 10,
        k = i % 100;
    if (j === 1 && k !== 11) {
        return i + 'st';
    }
    if (j === 2 && k !== 12) {
        return i + 'nd';
    }
    if (j === 3 && k !== 13) {
        return i + 'rd';
    }
    return i + 'th';
}

export function formatSnapshotChoice(choice: SnapshotChoice, type: string, choices: string[]) {
    if (['single-choice', 'basic'].includes(type) && typeof choice === 'number') {
        const target = choices[choice - 1];
        return target;
    } else if (type === 'approval' && Array.isArray(choice)) {
        return choice.map((c) => choices[c - 1]).join(', ');
    } else if (type === 'ranked-choice' && Array.isArray(choice)) {
        return choice.map((c, index) => `(${ordinal_suffix_of(index + 1)}) ${choices[c - 1]}`).join(', ');
    } else if (['quadratic', 'weighted'].includes(type) && typeof choice === 'object') {
        const total = sum(values(choice));
        return Object.entries(choice)
            .map(([key, value]) => {
                const percentage = total ? (value / total) * 100 : 0;
                const label = choices[Number.parseInt(key, 10) - 1];
                return `${Math.round(percentage)}% for ${label}`;
            })
            .join(', ');
    }

    return t`Encrypted choice`;
}
