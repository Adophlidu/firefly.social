import { describe, expect, it } from 'vitest';

import { buildConnectorPath } from '@/helpers/prediction/category/bracket/connectorPath.js';

describe('buildConnectorPath', () => {
    it('draws a straight line when source and target share the vertical center', () => {
        const d = buildConnectorPath(100, 50, 200, 50, 8);
        expect(d).toBe('M 100 50 L 200 50');
        // No turns to round -> never emits a quadratic Bézier.
        expect(d).not.toMatch(/Q/);
    });

    it('rounds a downward hop (py > sy) with two quadratic corners landing on the anchors', () => {
        const d = buildConnectorPath(100, 40, 200, 160, 8);
        // midX = 150, sign = +1: roundover at (150,40) then (150,160).
        expect(d).toBe('M 100 40 L 142 40 Q 150 40 150 48 L 150 152 Q 150 160 158 160 L 200 160');
        expect(d.startsWith('M 100 40')).toBe(true);
        expect(d.endsWith('L 200 160')).toBe(true);
        // Exactly two corners.
        expect(d.match(/Q/g)).toHaveLength(2);
    });

    it('rounds an upward hop (py < sy) symmetrically', () => {
        const d = buildConnectorPath(100, 160, 200, 40, 8);
        // sign = -1: the vertical segment climbs from 152 up to 48.
        expect(d).toBe('M 100 160 L 142 160 Q 150 160 150 152 L 150 48 Q 150 40 158 40 L 200 40');
        expect(d.startsWith('M 100 160')).toBe(true);
        expect(d.endsWith('L 200 40')).toBe(true);
        expect(d.match(/Q/g)).toHaveLength(2);
    });

    it('clamps a radius larger than half the travel without breaking the route', () => {
        // Only 10px of vertical travel -> max radius is 5.
        const d = buildConnectorPath(100, 50, 200, 60, 8);
        expect(d).toBe('M 100 50 L 145 50 Q 150 50 150 55 L 150 55 Q 150 60 155 60 L 200 60');
        // Still two rounded corners and the endpoint is exact.
        expect(d.endsWith('L 200 60')).toBe(true);
        expect(d.match(/Q/g)).toHaveLength(2);
    });

    it('falls back to the sharp stair-step when the vertical hop is too small to round', () => {
        // |dy| < 1 clamps the radius below 0.5, leaving no room to round.
        const d = buildConnectorPath(100, 50, 200, 50.6, 8);
        expect(d).toBe('M 100 50 H 150 V 50.6 H 200');
        expect(d).not.toMatch(/Q/);
    });
});
