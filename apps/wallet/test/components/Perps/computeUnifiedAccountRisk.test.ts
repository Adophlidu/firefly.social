import { describe, expect, it } from 'vitest';

import { computeUnifiedAccountRisk } from '@/components/Perps/computeUnifiedAccountRisk.js';

describe('computeUnifiedAccountRisk', () => {
    it('aggregates maintenance margin across DEXes and takes the highest collateral ratio', () => {
        expect(
            computeUnifiedAccountRisk(
                [
                    {
                        collateralToken: 0,
                        crossMaintenanceMarginUsed: '10',
                        positions: [
                            { leverage: { type: 'cross' }, marginUsed: '40' },
                            { leverage: { type: 'isolated' }, marginUsed: '20' },
                        ],
                    },
                    {
                        collateralToken: 0,
                        crossMaintenanceMarginUsed: '5',
                        positions: [{ leverage: { type: 'isolated' }, marginUsed: '5' }],
                    },
                    {
                        collateralToken: 1,
                        crossMaintenanceMarginUsed: '6',
                        positions: [],
                    },
                ],
                [
                    { token: 0, total: '100' },
                    { token: 1, total: '20' },
                ],
            ),
        ).toEqual({ maintenanceMargin: '21', ratio: 0.3 });
    });

    it('ignores collateral without a positive available balance', () => {
        expect(
            computeUnifiedAccountRisk(
                [
                    {
                        collateralToken: 0,
                        crossMaintenanceMarginUsed: '10',
                        positions: [{ leverage: { type: 'isolated' }, marginUsed: '100' }],
                    },
                ],
                [{ token: 0, total: '100' }],
            ),
        ).toEqual({ maintenanceMargin: '10', ratio: 0 });
    });
});
