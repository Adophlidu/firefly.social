import BigNumber from 'bignumber.js';

interface UnifiedAccountPosition {
    leverage: { type: 'cross' | 'isolated' };
    marginUsed: string;
}

interface UnifiedAccountDexState {
    collateralToken: number;
    crossMaintenanceMarginUsed?: string;
    positions: UnifiedAccountPosition[];
}

interface UnifiedAccountSpotBalance {
    token: number;
    total: string;
}

export function computeUnifiedAccountRisk(
    dexStates: UnifiedAccountDexState[],
    spotBalances: UnifiedAccountSpotBalance[],
) {
    const crossMaintenanceByToken = new Map<number, BigNumber>();
    const isolatedMarginByToken = new Map<number, BigNumber>();
    let maintenanceMargin = new BigNumber(0);

    for (const { collateralToken, crossMaintenanceMarginUsed = '0', positions } of dexStates) {
        const crossMaintenance = new BigNumber(crossMaintenanceMarginUsed);
        maintenanceMargin = maintenanceMargin.plus(crossMaintenance);
        crossMaintenanceByToken.set(
            collateralToken,
            (crossMaintenanceByToken.get(collateralToken) ?? new BigNumber(0)).plus(crossMaintenance),
        );

        const isolatedMargin = positions.reduce(
            (total, position) => (position.leverage.type === 'isolated' ? total.plus(position.marginUsed) : total),
            new BigNumber(0),
        );
        isolatedMarginByToken.set(
            collateralToken,
            (isolatedMarginByToken.get(collateralToken) ?? new BigNumber(0)).plus(isolatedMargin),
        );
    }

    let ratio = new BigNumber(0);
    for (const [collateralToken, crossMaintenance] of crossMaintenanceByToken) {
        const spotTotal = new BigNumber(
            spotBalances.find((balance) => balance.token === collateralToken)?.total ?? '0',
        );
        const available = spotTotal.minus(isolatedMarginByToken.get(collateralToken) ?? 0);
        if (available.lte(0)) continue;
        ratio = BigNumber.max(ratio, crossMaintenance.dividedBy(available));
    }

    return {
        maintenanceMargin: maintenanceMargin.toFixed(),
        ratio: ratio.toNumber(),
    };
}
