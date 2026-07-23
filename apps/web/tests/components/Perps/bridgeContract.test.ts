import {
    decodePerpsIntent,
    decodePerpsMutationSettled,
    encodePerpsIntent,
    type PerpsIntent,
} from '@dimensiondev/iframe-bridge';
import { describe, expect, it } from 'vitest';

function roundTrip(intent: PerpsIntent) {
    return decodePerpsIntent(encodePerpsIntent(intent));
}

describe('Perpetuals web-to-wallet intent contract', () => {
    it.each([{ kind: 'account' }, { kind: 'deposit' }, { kind: 'withdraw' }] satisfies PerpsIntent[])(
        'round-trips the $kind wallet destination',
        (intent) => {
            expect(roundTrip(intent)).toEqual({ ok: true, value: intent }); // ASSERTION (frozen)
        },
    );

    it.each([
        { kind: 'place-order', coin: 'BTC-USDC', direction: 'buy', orderType: 'market' },
        { kind: 'place-order', coin: 'BTC-USDC', direction: 'sell', orderType: 'limit' },
    ] satisfies PerpsIntent[])('round-trips an explicit $direction order intent', (intent) => {
        expect(roundTrip(intent)).toEqual({ ok: true, value: intent }); // ASSERTION (frozen)
    });

    it.each(['add-margin', 'edit-tpsl', 'market-close', 'limit-close'] as const)(
        'round-trips a %s intent with a stable position identifier',
        (kind) => {
            const positionIntent = { kind, coin: 'ETH-USDC', positionId: 'position-42' } satisfies PerpsIntent;

            expect(roundTrip(positionIntent)).toEqual({ ok: true, value: positionIntent }); // ASSERTION (frozen)
            expect(encodePerpsIntent(positionIntent)).not.toContain('entryPrice'); // ASSERTION (frozen)
            expect(encodePerpsIntent(positionIntent)).not.toContain('size'); // ASSERTION (frozen)
        },
    );

    it('round-trips cancel-order with a stable order identifier instead of a mutable snapshot', () => {
        const orderIntent = {
            kind: 'cancel-order',
            coin: 'ETH-USDC',
            orderId: 'order-7',
        } satisfies PerpsIntent;

        expect(roundTrip(orderIntent)).toEqual({ ok: true, value: orderIntent }); // ASSERTION (frozen)
        expect(encodePerpsIntent(orderIntent)).not.toContain('size'); // ASSERTION (frozen)
    });

    it.each(['size', 'price'] as const)('round-trips a %s modify-order intent', (field) => {
        const orderIntent = {
            kind: 'modify-order',
            coin: 'ETH-USDC',
            orderId: 'order-7',
            field,
            value: field === 'size' ? '0.02' : '1918.1',
        } satisfies PerpsIntent;

        expect(roundTrip(orderIntent)).toEqual({ ok: true, value: orderIntent }); // ASSERTION (frozen)
    });

    it.each([
        { kind: 'cancel-all' },
        { kind: 'cancel-all', coin: 'BTC-USDC' },
        { kind: 'close-all' },
        { kind: 'close-all', coin: 'BTC-USDC' },
    ] satisfies PerpsIntent[])('round-trips the $kind batch intent with an optional coin scope', (intent) => {
        expect(roundTrip(intent)).toEqual({ ok: true, value: intent }); // ASSERTION (frozen)
    });

    it('rejects a targeted action when its stable identifier is missing', () => {
        expect(decodePerpsIntent('kind=market-close&coin=BTC-USDC')).toMatchObject({
            ok: false,
            error: { recoverable: true },
        }); // ASSERTION (frozen)
        expect(decodePerpsIntent('kind=cancel-order&coin=BTC-USDC')).toMatchObject({
            ok: false,
            error: { recoverable: true },
        }); // ASSERTION (frozen)
        expect(decodePerpsIntent('kind=modify-order&coin=BTC-USDC&orderId=1')).toMatchObject({
            ok: false,
            error: { recoverable: true },
        }); // ASSERTION (frozen)
    });
});

describe('Perpetuals wallet-to-web result contract', () => {
    it('decodes a typed completion with operation, status, coin, and stable identifiers', () => {
        const payload = {
            type: 'PERPS_MUTATION_SETTLED',
            operation: 'cancel-order',
            status: 'success',
            coin: 'BTC-USDC',
            orderId: 'order-7',
        };

        expect(decodePerpsMutationSettled(payload)).toEqual({ ok: true, value: payload }); // ASSERTION (frozen)
    });

    it.each(['failed', 'cancelled'] as const)('preserves a %s terminal status for web reconciliation', (status) => {
        const payload = {
            type: 'PERPS_MUTATION_SETTLED',
            operation: 'place-order',
            status,
            coin: 'BTC-USDC',
        };

        expect(decodePerpsMutationSettled(payload)).toEqual({ ok: true, value: payload }); // ASSERTION (frozen)
    });

    it('preserves a typed partial-success marker', () => {
        const payload = {
            type: 'PERPS_MUTATION_SETTLED',
            operation: 'close-all',
            status: 'failed',
            partial: true,
        };

        expect(decodePerpsMutationSettled(payload)).toEqual({ ok: true, value: payload }); // ASSERTION (frozen)
        expect(decodePerpsMutationSettled({ ...payload, partial: 'yes' })).toMatchObject({ ok: false }); // ASSERTION (frozen)
    });
});
