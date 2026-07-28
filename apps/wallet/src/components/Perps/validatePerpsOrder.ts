import BigNumber from 'bignumber.js';

type PerpsOrderIssue =
    | 'size-required'
    | 'below-minimum-size'
    | 'leverage-out-of-range'
    | 'limit-price-required'
    | 'reduce-only-size-exceeded'
    | 'tpsl-unsupported';

interface PerpsOrderInput {
    coin: string;
    direction: 'buy' | 'sell';
    marginMode: 'cross' | 'isolated';
    leverage: number;
    orderType: 'market' | 'limit';
    limitPrice?: string;
    size: string;
    sizeUnit: 'coin' | 'usdc';
    reduceOnly: boolean;
    availablePositionSize?: string;
    takeProfitPrice?: string;
    stopLossPrice?: string;
}

interface PerpsMarketConstraints {
    minimumSize: string;
    minimumLeverage: number;
    maximumLeverage: number;
    supportsTakeProfitStopLoss: boolean;
}

export function validatePerpsOrder(input: PerpsOrderInput, constraints: PerpsMarketConstraints) {
    const issues: Array<{ code: PerpsOrderIssue }> = [];
    const size = new BigNumber(input.size || '0');
    if (!size.isPositive()) issues.push({ code: 'size-required' });
    else if (input.sizeUnit === 'coin' && size.isLessThan(constraints.minimumSize)) {
        issues.push({ code: 'below-minimum-size' });
    }
    if (input.leverage < constraints.minimumLeverage || input.leverage > constraints.maximumLeverage) {
        issues.push({ code: 'leverage-out-of-range' });
    }
    if (input.orderType === 'limit' && (!input.limitPrice || !new BigNumber(input.limitPrice).isPositive())) {
        issues.push({ code: 'limit-price-required' });
    }
    if (input.reduceOnly && input.availablePositionSize && size.isGreaterThan(input.availablePositionSize)) {
        issues.push({ code: 'reduce-only-size-exceeded' });
    }
    if ((input.takeProfitPrice || input.stopLossPrice) && !constraints.supportsTakeProfitStopLoss) {
        issues.push({ code: 'tpsl-unsupported' });
    }
    return issues.length ? ({ ok: false, issues } as const) : ({ ok: true } as const);
}
