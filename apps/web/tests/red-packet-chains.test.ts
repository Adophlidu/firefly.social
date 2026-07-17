import { RED_PACKETS, rpSupportedChains, visibleChains } from '@dimensiondev/web3/chains';
import { describe, expect, it } from 'vitest';

describe('red-packet supported chains (FW-7873)', () => {
    const supportedIds = rpSupportedChains.map((c) => c.id);
    const visibleIds = visibleChains.map((c) => c.id);

    // The picker chain scope must stay derived from the contract map, not a second
    // hand-maintained list. This is the exact drift that hid avalanche/scroll/linea/
    // celo/zkSync tokens in the red-packet picker even though contracts exist there.
    it('is derived from visibleChains ∩ RED_PACKETS', () => {
        const expected = visibleChains.filter((c) => RED_PACKETS[c.id]).map((c) => c.id);
        expect(supportedIds).toEqual(expected);
    });

    it('contains every visible chain that has a deployed contract', () => {
        for (const id of visibleIds) {
            if (RED_PACKETS[id]) expect(supportedIds).toContain(id);
        }
    });

    it('excludes every visible chain that has no deployed contract', () => {
        for (const id of visibleIds) {
            if (!RED_PACKETS[id]) expect(supportedIds).not.toContain(id);
        }
    });

    // Regression guard for the chains re-enabled in FW-7873. If any disappears, a
    // contract was dropped from RED_PACKETS or a chain removed from visibleChains —
    // almost certainly unintentional.
    it.each([
        ['avalanche', 43114],
        ['scroll', 534352],
        ['linea', 59144],
        ['celo', 42220],
        ['zkSync', 324],
    ])('supports %s (%i)', (_name, id) => {
        expect(supportedIds).toContain(id);
    });

    // Chains with no red-packet contract must stay excluded so users can't pick a
    // token they then can't put into a red packet.
    it.each([
        ['blast', 81457],
        ['robinhood', 4663],
    ])('does not support %s (%i) — no deployed contract', (_name, id) => {
        expect(supportedIds).not.toContain(id);
    });
});
