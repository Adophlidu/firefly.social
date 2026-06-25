import { describe, expect, it } from 'vitest';

import { createQrCodeDataUri } from '@/services/polymarketShareImage/assets.js';
import { applyFrostedGlass } from '@/services/polymarketShareImage/render.js';

const CARD_BG = 'rgba(255,255,255,0.10)';

describe('applyFrostedGlass', () => {
    it('replaces a translucent card panel with the blurred-glass stack and injects the filter', () => {
        const svg = `<svg><defs></defs><path d="M0 0 H10 V10 Z" fill="${CARD_BG}"/></svg>`;
        const out = applyFrostedGlass(svg);
        expect(out).toContain('pm-glass-blur'); // the feGaussianBlur filter was injected
        expect(out).toContain('<clipPath id="pm-glass-0">');
        expect(out).toContain('feGaussianBlur');
    });

    it('is a no-op when there is no translucent card panel to frost', () => {
        const svg = '<svg><defs></defs><path d="M0 0" fill="#ffffff"/></svg>';
        expect(applyFrostedGlass(svg)).toBe(svg);
    });
});

describe('createQrCodeDataUri', () => {
    it('builds an SVG data URI with the centred Firefly logo knocked into the QR', () => {
        const uri = createQrCodeDataUri('https://firefly.social/');
        expect(uri.startsWith('data:image/svg+xml;utf8,')).toBe(true);
        const svg = decodeURIComponent(uri.replace('data:image/svg+xml;utf8,', ''));
        expect(svg).toContain('<svg');
        expect(svg).toContain('<g transform='); // the injected centre logo group
    });
});
