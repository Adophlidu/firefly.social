import { MetadataAttributeType } from '@dimensiondev/enums';
import { describe, expect, test } from 'vitest';

import {
    buildLpt1PositionAttributes,
    buildLpt1Tags,
    hashItemKey,
    isValidAppSlug,
    isValidDirectItemKey,
    isValidHashedItemKey,
    isValidLpt1Tag,
    isValidSourceSlug,
    isValidTopicPath,
    LPT1_APP_SLUG_MAX_LENGTH,
    LPT1_APP_TAG,
    LPT1_MAX_TAG_LENGTH,
    LPT1_SOURCE_POLYMARKET,
    LPT1_SOURCE_SLUG_MAX_LENGTH,
    LPT1_TOPIC_PATH_MAX_LENGTH,
    LPT1_TOPIC_POLYMARKET,
    LPT1_TOPIC_POLYMARKET_EVENT,
    LPT1_TOPIC_POLYMARKET_POSITION,
    lpt1EventQueryTags,
    lpt1ItemTag,
    parseLpt1Tags,
    readLpt1Position,
    WORLD_CUP_TAG,
} from '@/helpers/lpt1.js';

describe('isValidDirectItemKey', () => {
    test('accepts a real event slug', () => {
        expect(isValidDirectItemKey('fifwc-arg-egy-2026-07-07')).toBe(true);
        expect(isValidDirectItemKey('btc-updown-5m-1780540200')).toBe(true);
    });
    test('rejects empty, uppercase, unicode, slashes, and the reserved hashed form', () => {
        expect(isValidDirectItemKey('')).toBe(false);
        expect(isValidDirectItemKey('FIFWC-Arg')).toBe(false);
        expect(isValidDirectItemKey('预测市场')).toBe(false);
        expect(isValidDirectItemKey('a/b')).toBe(false);
        // reserved hashed form (h/ + 26 Base32) is not a direct key (spec §8.11, §13)
        expect(isValidDirectItemKey('h/qzltb22lvj4jtk2f2x7umzo2oz')).toBe(false);
    });
    test('rejects keys longer than 40 chars', () => {
        expect(isValidDirectItemKey('a'.repeat(40))).toBe(true);
        expect(isValidDirectItemKey('a'.repeat(41))).toBe(false);
    });
});

describe('isValidLpt1Tag', () => {
    test('accepts well-formed tags incl. the bare marker', () => {
        expect(isValidLpt1Tag('lpt1')).toBe(true);
        expect(isValidLpt1Tag(LPT1_APP_TAG)).toBe(true);
        expect(isValidLpt1Tag(lpt1ItemTag('fifwc-arg-egy-2026-07-07'))).toBe(true);
    });
    test('rejects uppercase, whitespace, unicode, non-lpt1', () => {
        expect(isValidLpt1Tag('LPT1/app/firefly')).toBe(false);
        expect(isValidLpt1Tag('lpt1/app/fire fly')).toBe(false);
        expect(isValidLpt1Tag('lpt1/topic/预测市场')).toBe(false);
        expect(isValidLpt1Tag('firefly')).toBe(false);
    });
    test('rejects tags over 50 chars', () => {
        expect(isValidLpt1Tag(`${'lpt1/topic/'}${'a'.repeat(LPT1_MAX_TAG_LENGTH)}`)).toBe(false);
    });
});

describe('isValidHashedItemKey', () => {
    test('accepts h/ + exactly 26 lowercase base32 chars', () => {
        expect(isValidHashedItemKey('h/qzltb22lvj4jtk2f2x7umzo2oz')).toBe(true);
    });
    test('rejects wrong length, missing marker, uppercase, and non-base32 chars', () => {
        expect(isValidHashedItemKey('h/qzltb22lvj4jtk2f2x7umzo2o')).toBe(false); // 25 chars
        expect(isValidHashedItemKey('h/qzltb22lvj4jtk2f2x7umzo2oz0')).toBe(false); // 27 chars
        expect(isValidHashedItemKey('h/QZLTB22LVJ4JTK2F2X7UMZO2OZ')).toBe(false); // uppercase
        expect(isValidHashedItemKey('qzltb22lvj4jtk2f2x7umzo2oz')).toBe(false); // missing h/
        expect(isValidHashedItemKey('h/qzltb22lvj4jtk2f2x7umzo2o1')).toBe(false); // '1' not in [a-z2-7]
    });
});

describe('hashItemKey (spec §14/§15)', () => {
    test('matches the §15 test vector', async () => {
        expect(await hashItemKey('polymarket', 'btc-updown-5m-1780540200')).toBe(
            'lpt1/item/h/qzltb22lvj4jtk2f2x7umzo2oz',
        );
    });
    test('produces a valid hashed item tag and diverges by source', async () => {
        const tag = await hashItemKey('polymarket', 'btc-updown-5m-1780540200');
        expect(tag.startsWith('lpt1/item/h/')).toBe(true);
        expect(isValidHashedItemKey(tag.slice('lpt1/item/'.length))).toBe(true);
        // same id, different source -> different hash (spec §14 source-in-input rule)
        const otherSource = await hashItemKey('orb', 'btc-updown-5m-1780540200');
        expect(otherSource).not.toBe(tag);
        // same source, different id -> different hash
        const otherId = await hashItemKey('polymarket', 'some-other-id');
        expect(otherId).not.toBe(tag);
    });
});

describe('per-type length limits (spec §9)', () => {
    test('isValidAppSlug: segment + ≤41 chars', () => {
        expect(isValidAppSlug('firefly')).toBe(true);
        expect(isValidAppSlug('a'.repeat(LPT1_APP_SLUG_MAX_LENGTH))).toBe(true);
        expect(isValidAppSlug('a'.repeat(LPT1_APP_SLUG_MAX_LENGTH + 1))).toBe(false);
        expect(isValidAppSlug('Firefly')).toBe(false); // uppercase
        expect(isValidAppSlug('')).toBe(false);
    });
    test('isValidSourceSlug: segment + ≤38 chars', () => {
        expect(isValidSourceSlug('polymarket')).toBe(true);
        expect(isValidSourceSlug('a'.repeat(LPT1_SOURCE_SLUG_MAX_LENGTH))).toBe(true);
        expect(isValidSourceSlug('a'.repeat(LPT1_SOURCE_SLUG_MAX_LENGTH + 1))).toBe(false);
        expect(isValidSourceSlug('Polymarket')).toBe(false);
    });
    test('isValidTopicPath: one or more /-separated segments, ≤39 chars total', () => {
        expect(isValidTopicPath('polymarket/event')).toBe(true);
        expect(isValidTopicPath('worldcup26')).toBe(true);
        expect(isValidTopicPath('a'.repeat(LPT1_TOPIC_PATH_MAX_LENGTH))).toBe(true);
        expect(isValidTopicPath('a'.repeat(LPT1_TOPIC_PATH_MAX_LENGTH + 1))).toBe(false);
        expect(isValidTopicPath('polymarket/')).toBe(false); // trailing empty segment
        expect(isValidTopicPath('/event')).toBe(false); // leading empty segment
        expect(isValidTopicPath('polymarket//event')).toBe(false); // repeated delimiter
    });
});

describe('buildLpt1Tags', () => {
    test('emits the LPT-1 base set + worldcup interop tag, ordered per spec', () => {
        expect(buildLpt1Tags({ eventSlug: 'fifwc-arg-egy-2026-07-07' })).toEqual([
            'lpt1',
            LPT1_APP_TAG,
            'lpt1/topic/worldcup26',
            LPT1_TOPIC_POLYMARKET,
            LPT1_TOPIC_POLYMARKET_EVENT,
            LPT1_SOURCE_POLYMARKET,
            lpt1ItemTag('fifwc-arg-egy-2026-07-07'),
            WORLD_CUP_TAG,
        ]);
    });
    test('appends the position signal tag when hasPosition', () => {
        const tags = buildLpt1Tags({ eventSlug: 'fifwc-arg-egy-2026-07-07', hasPosition: true });
        expect(tags).toContain(LPT1_TOPIC_POLYMARKET_POSITION);
        // position topic sits after polymarket/event (topic group, broadest→specific).
        expect(tags.indexOf(LPT1_TOPIC_POLYMARKET_EVENT)).toBeLessThan(tags.indexOf(LPT1_TOPIC_POLYMARKET_POSITION));
        // parent closure is satisfied (polymarket ancestor present).
        expect(tags).toContain(LPT1_TOPIC_POLYMARKET);
        // worldcup interop tag is always last.
        expect(tags[tags.length - 1]).toBe(WORLD_CUP_TAG);
    });
    test('throws on an invalid event slug', () => {
        expect(() => buildLpt1Tags({ eventSlug: 'Invalid Slug' })).toThrow();
        expect(() => buildLpt1Tags({ eventSlug: '' })).toThrow();
    });
    test('produces only valid, unique tags', () => {
        const tags = buildLpt1Tags({ eventSlug: 'fifwc-arg-egy-2026-07-07', hasPosition: true });
        expect(new Set(tags).size).toBe(tags.length);

        // every tag is either a valid LPT-1 tag or the non-protocol worldcup interop tag
        for (const tag of tags) expect(isValidLpt1Tag(tag) || tag === WORLD_CUP_TAG).toBe(true);
    });
});

describe('parseLpt1Tags', () => {
    test('round-trips buildLpt1Tags output', () => {
        const slug = 'fifwc-arg-egy-2026-07-07';
        const parsed = parseLpt1Tags(buildLpt1Tags({ eventSlug: slug, hasPosition: true }));
        expect(parsed.app).toBe('firefly');
        expect(parsed.source).toBe('polymarket');
        expect(parsed.eventSlug).toBe(slug);
        expect(parsed.hasPosition).toBe(true);
        expect(parsed.topics).toEqual(['worldcup26', 'polymarket', 'polymarket/event', 'polymarket/position']);
    });
    test('hasPosition is false without the position topic', () => {
        const parsed = parseLpt1Tags(buildLpt1Tags({ eventSlug: 'fifwc-arg-egy-2026-07-07' }));
        expect(parsed.hasPosition).toBe(false);
    });
    test('ignores non-LPT-1 and malformed tags', () => {
        const parsed = parseLpt1Tags([
            'firefly',
            'lpt1/app', // missing slug
            LPT1_APP_TAG,
            lpt1ItemTag('fifwc-arg-egy-2026-07-07'),
        ]);
        expect(parsed.app).toBe('firefly');
        expect(parsed.eventSlug).toBe('fifwc-arg-egy-2026-07-07');
    });
    test('does not treat a hashed item key as an event slug', () => {
        const parsed = parseLpt1Tags(['lpt1/item/h/qzltb22lvj4jtk2f2x7umzo2oz', LPT1_APP_TAG]);
        expect(parsed.eventSlug).toBeUndefined();
    });
    test('returns empty result for no tags', () => {
        expect(parseLpt1Tags([])).toEqual({ topics: [], hasPosition: false });
        expect(parseLpt1Tags(undefined)).toEqual({ topics: [], hasPosition: false });
    });
});

describe('position attributes', () => {
    const input = {
        conditionId: '0xcondition',
        outcome: 'Yes',
        outcomeIndex: 0,
        shares: 12.5,
        price: 0.62,
        marketId: '5566',
    };

    test('buildLpt1PositionAttributes emits namespaced STRING/NUMBER attributes', () => {
        const attrs = buildLpt1PositionAttributes(input);
        const byKey = Object.fromEntries(attrs.map((a) => [a.key, a]));
        expect(byKey.lpt1_conditionId).toEqual({
            key: 'lpt1_conditionId',
            type: MetadataAttributeType.STRING,
            value: '0xcondition',
        });
        expect(byKey.lpt1_outcome).toEqual({ key: 'lpt1_outcome', type: MetadataAttributeType.STRING, value: 'Yes' });
        expect(byKey.lpt1_outcomeIndex).toEqual({
            key: 'lpt1_outcomeIndex',
            type: MetadataAttributeType.NUMBER,
            value: '0',
        });
        expect(byKey.lpt1_shares).toEqual({ key: 'lpt1_shares', type: MetadataAttributeType.NUMBER, value: '12.5' });
        expect(byKey.lpt1_price).toEqual({ key: 'lpt1_price', type: MetadataAttributeType.NUMBER, value: '0.62' });
        expect(byKey.lpt1_marketId).toEqual({
            key: 'lpt1_marketId',
            type: MetadataAttributeType.STRING,
            value: '5566',
        });
    });

    test('omits marketId attribute when not provided', () => {
        const attrs = buildLpt1PositionAttributes({ ...input, marketId: undefined });
        expect(attrs.find((a) => a.key === 'lpt1_marketId')).toBeUndefined();
    });

    test('readLpt1Position round-trips the attributes', () => {
        const round = readLpt1Position(buildLpt1PositionAttributes(input));
        expect(round).toEqual({
            conditionId: '0xcondition',
            outcome: 'Yes',
            outcomeIndex: 0,
            shares: 12.5,
            price: 0.62,
            marketId: '5566',
        });
    });

    test('readLpt1Position returns null without conditionId', () => {
        expect(readLpt1Position([])).toBeNull();
        expect(readLpt1Position(null)).toBeNull();
        expect(
            readLpt1Position([{ key: 'lpt1_outcome', type: MetadataAttributeType.STRING, value: 'Yes' }]),
        ).toBeNull();
    });

    test('readLpt1Position coerces strings to numbers, defaulting missing to 0', () => {
        const attrs = buildLpt1PositionAttributes({
            conditionId: 'c',
            outcome: 'No',
            outcomeIndex: 1,
            shares: 3,
            price: 0.4,
        });
        const round = readLpt1Position(attrs);
        expect(round?.outcomeIndex).toBe(1);
        expect(round?.shares).toBe(3);
        expect(round?.price).toBe(0.4);
        expect(round?.marketId).toBeUndefined();
    });
});

describe('query builders', () => {
    test('lpt1EventQueryTags returns the event-scoped all-of set (polymarket/event + source + item)', () => {
        expect(lpt1EventQueryTags('fifwc-arg-egy-2026-07-07')).toEqual([
            LPT1_TOPIC_POLYMARKET_EVENT,
            LPT1_SOURCE_POLYMARKET,
            lpt1ItemTag('fifwc-arg-egy-2026-07-07'),
        ]);
    });
});
