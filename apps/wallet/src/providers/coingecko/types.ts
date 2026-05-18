import type { CurrencyType } from '@dimensiondev/enums';

export type Price = Partial<Record<CurrencyType, string>>;
