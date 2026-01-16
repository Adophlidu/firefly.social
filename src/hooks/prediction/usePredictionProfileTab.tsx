import { useQueryState } from 'nuqs';
import { parseAsStringEnum } from 'nuqs/server';

export enum Category {
    Positions = 'positions',
    Trades = 'trades',
}

export function usePredictionProfileTab() {
    return useQueryState<Category>(
        'tab',
        parseAsStringEnum([Category.Positions, Category.Trades]).withDefault(Category.Positions),
    );
}
