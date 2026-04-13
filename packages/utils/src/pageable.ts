const $Pageable = 'Pageable' as const;
const $PageIndicator = 'PageIndicator' as const;

export const INITIAL_PAGEABLE_PARAM = 'INITIAL_PARAM';

export interface Pageable<Item, Indicator = unknown> {
    __type__: typeof $Pageable;
    indicator: Indicator;
    nextIndicator?: Indicator;
    data: Item[];
    total?: number;
}

export interface PageIndicator {
    __type__: typeof $PageIndicator;
    id: string;
    index: number;
    size?: number;
}

export function createIndicator(indicator?: PageIndicator, id?: string, size?: number): PageIndicator {
    const index = indicator?.index ?? 0;
    return {
        __type__: $PageIndicator,
        id: id ?? indicator?.id ?? index.toString(),
        index,
        size: size ?? indicator?.size,
    };
}

export function createNextIndicator(indicator?: PageIndicator, id?: string, size?: number): PageIndicator {
    const index = (indicator?.index ?? 0) + 1;
    return typeof id === 'string'
        ? {
              __type__: $PageIndicator,
              id,
              index,
              size: size ?? indicator?.size,
          }
        : {
              __type__: $PageIndicator,
              id: index.toString(),
              index,
              size: size ?? indicator?.size,
          };
}

export function createPageable<Item, Indicator = PageIndicator>(
    data: Item[],
    indicator: Indicator,
    nextIndicator?: Indicator,
    total?: number,
): Pageable<Item, Indicator> {
    if (typeof nextIndicator !== 'undefined') {
        return {
            __type__: $Pageable,
            data,
            indicator,
            nextIndicator,
            total,
        };
    }
    return {
        __type__: $Pageable,
        data,
        indicator,
        total,
    };
}

export async function* pageableToIterator<T>(
    getPageable: (indicator?: PageIndicator) => Promise<Pageable<T> | void>,
    {
        maxSize = 25,
    }: {
        maxSize?: number;
    } = {},
) {
    let indicator = createIndicator();
    for (let i = 0; i < maxSize; i += 1) {
        try {
            const pageable = await getPageable(indicator);
            if (!pageable) return;
            yield* pageable.data;
            if (!pageable.nextIndicator) return;
            indicator = pageable.nextIndicator as PageIndicator;
        } catch (error) {
            yield new Error((error as Error).message);
        }
    }
}
