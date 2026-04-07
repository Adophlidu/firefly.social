import dayjs from 'dayjs';

type Result<T, K extends string = 'date'> = Array<T & Partial<Record<K, string>>>;

export function groupAndSortByDate<T, K extends string = 'date'>(
    list: T[],
    getDateKey: (entry: T) => string,
    key = 'date' as K,
) {
    const grouped = new Map<string, T[]>();

    for (const item of list) {
        const date = getDateKey(item);
        if (!grouped.has(date)) {
            grouped.set(date, []);
        }
        grouped.get(date)!.push(item);
    }

    return Array.from(grouped.entries())
        .sort((a, b) => dayjs(b[0]).valueOf() - dayjs(a[0]).valueOf())
        .flatMap(([date, items]) =>
            items.map((x, i) => {
                if (i === 0) return { ...x, [key]: date };
                return x;
            }),
        ) as Result<T>;
}
