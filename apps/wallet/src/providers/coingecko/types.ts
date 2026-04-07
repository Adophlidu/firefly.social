export enum CurrencyType {
    NATIVE = 'native',
    BTC = 'btc',
    ETH = 'eth',
    USD = 'usd',
    CNY = 'cny',
    HKD = 'hkd',
    JPY = 'jpy',
    EUR = 'eur',
}
export type Price = Partial<Record<CurrencyType, string>>;
