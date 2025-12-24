import { useQueryState } from 'nuqs';

export enum Category {
    Positions = 'positions',
    Trades = 'trades',
}

export function useBetsProfileTab() {
    return useQueryState<Category>('tab', {
        defaultValue: Category.Positions,
        parse: (val) => {
            return [Category.Positions, Category.Trades].some((x) => x === val)
                ? (val as Category)
                : Category.Positions;
        },
    });
}
