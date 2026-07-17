import { MetadataAttributeType } from '@dimensiondev/enums';
import { describe, expect, test } from 'vitest';

import {
    buildLpt1PositionAttributes,
    buildLpt1PositionTags,
    buildLpt1ReplyTags,
    buildLpt1Tags,
    buildOrbComposePayload,
    hashItemKey,
    isLpt1Post,
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
    LPT1_SOURCE_POLYMARKET_POSITION,
    LPT1_SOURCE_SLUG_MAX_LENGTH,
    LPT1_TOPIC_PATH_MAX_LENGTH,
    LPT1_TOPIC_POLYMARKET,
    LPT1_TOPIC_POLYMARKET_EVENT,
    LPT1_TOPIC_POLYMARKET_POSITION,
    LPT1_TOPIC_WORLDCUP,
    lpt1EventQueryTags,
    lpt1ItemTag,
    parseLpt1Tags,
    readLpt1Position,
    readLpt1PositionFromTags,
    truncatedDecimalString,
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

describe('isLpt1Post', () => {
    test('false for a plain post with no LPT-1 tags', () => {
        expect(isLpt1Post(['firefly', 'worldcup'])).toBe(false);
    });
    test('true when the bare lpt1 root marker is present', () => {
        expect(isLpt1Post(['lpt1', 'worldcup'])).toBe(true);
    });
    test('true for a full lpt1/… tag set (Orb comment / World Cup post)', () => {
        expect(isLpt1Post(buildLpt1Tags({ eventSlug: 'fifwc-arg-egy-2026-07-07', includeWorldCup: true }))).toBe(true);
    });
    test('true when only a single lpt1/… prefix tag is present', () => {
        expect(isLpt1Post([LPT1_APP_TAG])).toBe(true);
    });
    test('false for empty / undefined tags', () => {
        expect(isLpt1Post([])).toBe(false);
        expect(isLpt1Post(undefined)).toBe(false);
        expect(isLpt1Post(null)).toBe(false);
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
    test('emits the LPT-1 base set without worldcup tags by default', () => {
        expect(buildLpt1Tags({ eventSlug: 'fifwc-arg-egy-2026-07-07' })).toEqual([
            'lpt1',
            LPT1_APP_TAG,
            LPT1_TOPIC_POLYMARKET,
            LPT1_TOPIC_POLYMARKET_EVENT,
            LPT1_SOURCE_POLYMARKET,
            lpt1ItemTag('fifwc-arg-egy-2026-07-07'),
        ]);
    });
    test('emits the worldcup interop tags when includeWorldCup is true, ordered per spec', () => {
        expect(buildLpt1Tags({ eventSlug: 'fifwc-arg-egy-2026-07-07', includeWorldCup: true })).toEqual([
            'lpt1',
            LPT1_APP_TAG,
            LPT1_TOPIC_WORLDCUP,
            LPT1_TOPIC_POLYMARKET,
            LPT1_TOPIC_POLYMARKET_EVENT,
            LPT1_SOURCE_POLYMARKET,
            lpt1ItemTag('fifwc-arg-egy-2026-07-07'),
            WORLD_CUP_TAG,
        ]);
    });
    test('appends the position signal tag when hasPosition', () => {
        const tags = buildLpt1Tags({
            eventSlug: 'fifwc-arg-egy-2026-07-07',
            hasPosition: true,
            includeWorldCup: true,
        });
        expect(tags).toContain(LPT1_TOPIC_POLYMARKET_POSITION);
        // position topic sits after polymarket/event (topic group, broadest→specific).
        expect(tags.indexOf(LPT1_TOPIC_POLYMARKET_EVENT)).toBeLessThan(tags.indexOf(LPT1_TOPIC_POLYMARKET_POSITION));
        // parent closure is satisfied (polymarket ancestor present).
        expect(tags).toContain(LPT1_TOPIC_POLYMARKET);
        // worldcup interop tag is always last.
        expect(tags[tags.length - 1]).toBe(WORLD_CUP_TAG);
    });
    test('appends iOS-style position data tags when position is supplied', () => {
        const tags = buildLpt1Tags({
            eventSlug: 'fifwc-arg-egy-2026-07-07',
            position: {
                conditionId: '0xcond',
                outcome: 'Yes',
                outcomeIndex: 0,
                shares: 2.8169,
                price: 0.3549,
                marketId: '2815607',
            },
        });
        // signal topic still emits, and the position data item tags are appended
        // right after it so iOS/Orb can read the position off the tags.
        expect(tags).toContain(LPT1_TOPIC_POLYMARKET_POSITION);
        expect(tags).toContain(LPT1_SOURCE_POLYMARKET_POSITION);
        expect(tags).toContain('lpt1/item/marketId/2815607');
        expect(tags).toContain('lpt1/item/shares/2.8169');
        expect(tags).toContain('lpt1/item/price/35.49'); // 0.3549 × 100 → cents
        expect(tags).toContain('lpt1/item/outcome/0');
        // the data tags sit after the event-slug item (matching the iOS/Orb tag order),
        // and after the position signal topic.
        expect(tags.indexOf(LPT1_TOPIC_POLYMARKET_POSITION)).toBeLessThan(tags.indexOf('lpt1/item/shares/2.8169'));
        expect(tags.indexOf(lpt1ItemTag('fifwc-arg-egy-2026-07-07'))).toBeLessThan(tags.indexOf('lpt1/item/outcome/0'));
    });
    test('position implies hasPosition (signal topic emits without hasPosition)', () => {
        const tags = buildLpt1Tags({
            eventSlug: 'fifwc-arg-egy-2026-07-07',
            position: { conditionId: 'c', outcome: 'No', outcomeIndex: 1, shares: 1, price: 0.5 },
        });
        expect(tags).toContain(LPT1_TOPIC_POLYMARKET_POSITION);
    });
    test('position block is contiguous and iOS state-machine-parseable', () => {
        // iOS's `parseLensTags` consumer enters the position data section ONLY when
        // `lpt1/source/polymarket/position` immediately follows
        // `lpt1/topic/polymarket/position`; any intervening `lpt1/topic/…` or
        // `lpt1/source/…` tag resets its state and the position is dropped. So the
        // topic → source → item-data tags must be contiguous (this is the real
        // cross-app acceptance criterion for FW-7899).
        const tags = buildLpt1Tags({
            eventSlug: 'fifwc-fra-esp-2026-07-14',
            includeWorldCup: true,
            position: {
                conditionId: '0xcond',
                outcome: 'Yes',
                outcomeIndex: 0,
                shares: 5.8823,
                price: 0.1699,
                marketId: '2880321',
            },
        });
        const topicIdx = tags.indexOf(LPT1_TOPIC_POLYMARKET_POSITION);
        const sourceIdx = tags.indexOf(LPT1_SOURCE_POLYMARKET_POSITION);
        // source/polymarket/position must IMMEDIATELY follow topic/polymarket/position.
        expect(sourceIdx).toBe(topicIdx + 1);
        // nothing between the position topic and the last data tag may be a
        // topic/source tag (that would reset iOS's parser).
        const lastDataIdx = tags.indexOf('lpt1/item/outcome/0');
        for (let i = topicIdx; i <= lastDataIdx; i += 1) {
            expect(tags[i].startsWith('lpt1/topic/') || tags[i].startsWith('lpt1/source/')).toBe(
                i === topicIdx || i === sourceIdx,
            );
        }
    });
    test('throws on an invalid event slug', () => {
        expect(() => buildLpt1Tags({ eventSlug: 'Invalid Slug' })).toThrow();
        expect(() => buildLpt1Tags({ eventSlug: '' })).toThrow();
    });
    test('produces only valid, unique tags', () => {
        const tags = buildLpt1Tags({
            eventSlug: 'fifwc-arg-egy-2026-07-07',
            hasPosition: true,
            includeWorldCup: true,
        });
        expect(new Set(tags).size).toBe(tags.length);

        // every tag is either a valid LPT-1 tag or the non-protocol worldcup interop tag
        for (const tag of tags) expect(isValidLpt1Tag(tag) || tag === WORLD_CUP_TAG).toBe(true);
    });
});

describe('buildOrbComposePayload (root comment + reply composition)', () => {
    const position = {
        conditionId: '0xcond',
        outcome: 'Yes',
        outcomeIndex: 0,
        shares: 2.8169,
        price: 0.3549,
        marketId: '2815607',
    } as const;

    test('with a position emits the position-topic tag + iOS data tags + lpt1_* attributes', () => {
        const payload = buildOrbComposePayload({ eventSlug: 'fifwc-arg-egy-2026-07-07', position });
        // signal topic emits ...
        expect(payload.lpt1Tags).toContain(LPT1_TOPIC_POLYMARKET_POSITION);
        // ... and so do the iOS-style data-bearing position tags (parity with a root
        // Orb comment — these are what iOS/Orb read to render the position pill).
        expect(payload.lpt1Tags).toContain(LPT1_SOURCE_POLYMARKET_POSITION);
        expect(payload.lpt1Tags).toContain('lpt1/item/shares/2.8169');
        expect(payload.lpt1Tags).toContain('lpt1/item/price/35.49');
        expect(payload.lpt1Tags).toContain('lpt1/item/outcome/0');
        // attributes carry the namespaced lpt1_* keys (web's PositionBadge reads these first).
        const keys = payload.lpt1Attributes?.map((a) => a.key) ?? [];
        expect(keys).toEqual(
            expect.arrayContaining([
                'lpt1_conditionId',
                'lpt1_outcome',
                'lpt1_outcomeIndex',
                'lpt1_shares',
                'lpt1_price',
                'lpt1_marketId',
            ]),
        );
    });

    test('without a position emits the event tags but lpt1Attributes === undefined', () => {
        const payload = buildOrbComposePayload({ eventSlug: 'fifwc-arg-egy-2026-07-07', position: null });
        // event-scoped base tags still present ...
        expect(payload.lpt1Tags).toContain(LPT1_TOPIC_POLYMARKET_EVENT);
        expect(payload.lpt1Tags).toContain(lpt1ItemTag('fifwc-arg-egy-2026-07-07'));
        // ... with no position signal and no data tags.
        expect(payload.lpt1Tags).not.toContain(LPT1_TOPIC_POLYMARKET_POSITION);
        expect(payload.lpt1Tags).not.toContain(LPT1_SOURCE_POLYMARKET_POSITION);
        expect(payload.lpt1Attributes).toBeUndefined();
    });

    test('FIFA slug adds the World Cup interop tags; non-FIFA does not', () => {
        const fifa = buildOrbComposePayload({ eventSlug: 'fifwc-arg-egy-2026-07-07' });
        expect(fifa.lpt1Tags).toContain(LPT1_TOPIC_WORLDCUP);
        expect(fifa.lpt1Tags).toContain(WORLD_CUP_TAG);

        const nonFifa = buildOrbComposePayload({ eventSlug: 'btc-updown-5m-1780540200' });
        expect(nonFifa.lpt1Tags).not.toContain(LPT1_TOPIC_WORLDCUP);
        expect(nonFifa.lpt1Tags).not.toContain(WORLD_CUP_TAG);
        // non-FIFA still emits the polymarket event topic + item tag.
        expect(nonFifa.lpt1Tags).toContain(LPT1_TOPIC_POLYMARKET_EVENT);
        expect(nonFifa.lpt1Tags).toContain(lpt1ItemTag('btc-updown-5m-1780540200'));
    });

    test('lpt1Tags is always a defined array (even without a position)', () => {
        const payload = buildOrbComposePayload({ eventSlug: 'btc-updown-5m-1780540200' });
        expect(Array.isArray(payload.lpt1Tags)).toBe(true);
        expect(payload.lpt1Tags.length).toBeGreaterThan(0);
    });

    test('reply scope emits the position block but NOT the event/worldcup discovery tags', () => {
        const payload = buildOrbComposePayload({
            eventSlug: 'fifwc-fra-esp-2026-07-14',
            position,
            scope: 'reply',
        });
        // position signal + iOS data block present (pill renders, iOS/Orb can read it)
        expect(payload.lpt1Tags).toContain(LPT1_TOPIC_POLYMARKET_POSITION);
        expect(payload.lpt1Tags).toContain(LPT1_SOURCE_POLYMARKET_POSITION);
        expect(payload.lpt1Tags).toContain('lpt1/item/shares/2.8169');
        expect(payload.lpt1Tags).toContain('lpt1/item/outcome/0');
        // attributes still carry the full position (web's PositionBadge reads these first)
        expect(payload.lpt1Attributes?.map((a) => a.key)).toEqual(
            expect.arrayContaining(['lpt1_conditionId', 'lpt1_outcome', 'lpt1_shares', 'lpt1_price']),
        );
        // event-discovery tags OMITTED so the reply doesn't match the event Comments
        // query (`getLensPostsByLpt1Item`) or the Home World Cup feed (`worldcup`).
        expect(payload.lpt1Tags).not.toContain(LPT1_TOPIC_POLYMARKET_EVENT);
        expect(payload.lpt1Tags).not.toContain(LPT1_SOURCE_POLYMARKET);
        expect(payload.lpt1Tags).not.toContain(lpt1ItemTag('fifwc-fra-esp-2026-07-14'));
        expect(payload.lpt1Tags).not.toContain(LPT1_TOPIC_WORLDCUP);
        expect(payload.lpt1Tags).not.toContain(WORLD_CUP_TAG);
    });

    test('reply scope without a position emits no tags and undefined attributes', () => {
        const payload = buildOrbComposePayload({
            eventSlug: 'fifwc-fra-esp-2026-07-14',
            position: null,
            scope: 'reply',
        });
        expect(payload.lpt1Tags).toEqual([]);
        expect(payload.lpt1Attributes).toBeUndefined();
    });
});

describe('buildLpt1ReplyTags (position-only reply tag set)', () => {
    const position = {
        conditionId: '0xcond',
        outcome: 'Yes',
        outcomeIndex: 0,
        shares: 2.8169,
        price: 0.3549,
        marketId: '2815607',
    } as const;

    test('emits the contiguous position block with parent closure, in iOS order', () => {
        const tags = buildLpt1ReplyTags(position);
        // root marker + app + polymarket parent (§13 closure) then the position block
        expect(tags).toEqual([
            'lpt1',
            LPT1_APP_TAG,
            LPT1_TOPIC_POLYMARKET,
            LPT1_TOPIC_POLYMARKET_POSITION,
            LPT1_SOURCE_POLYMARKET_POSITION,
            'lpt1/item/marketId/2815607',
            'lpt1/item/shares/2.8169',
            'lpt1/item/price/35.49',
            'lpt1/item/outcome/0',
        ]);
        // source/polymarket/position immediately follows topic/polymarket/position
        // (iOS state-machine requirement).
        expect(tags.indexOf(LPT1_SOURCE_POLYMARKET_POSITION)).toBe(tags.indexOf(LPT1_TOPIC_POLYMARKET_POSITION) + 1);
    });

    test('omits the event-discovery and worldcup tags entirely', () => {
        const tags = buildLpt1ReplyTags(position);
        expect(tags).not.toContain(LPT1_TOPIC_POLYMARKET_EVENT);
        expect(tags).not.toContain(LPT1_SOURCE_POLYMARKET);
        expect(tags).not.toContain(LPT1_TOPIC_WORLDCUP);
        expect(tags).not.toContain(WORLD_CUP_TAG);
        // no single-segment event-slug item key (`lpt1/item/{slug}`); only the
        // multi-segment position data tags (`lpt1/item/{field}/{value}`) remain.
        expect(tags).not.toContain(lpt1ItemTag('fifwc-fra-esp-2026-07-14'));
        expect(tags.filter((t) => t.startsWith('lpt1/item/') && !t.slice('lpt1/item/'.length).includes('/'))).toEqual(
            [],
        );
    });

    test('is discoverable as having a position via parseLpt1Tags (pill gate)', () => {
        // PositionBadge renders only when parseLpt1Tags().hasPosition is true.
        expect(parseLpt1Tags(buildLpt1ReplyTags(position)).hasPosition).toBe(true);
    });
});

describe('parseLpt1Tags', () => {
    test('round-trips buildLpt1Tags output', () => {
        const slug = 'fifwc-arg-egy-2026-07-07';
        const parsed = parseLpt1Tags(buildLpt1Tags({ eventSlug: slug, hasPosition: true, includeWorldCup: true }));
        expect(parsed.app).toBe('firefly');
        expect(parsed.source).toBe('polymarket');
        expect(parsed.eventSlug).toBe(slug);
        expect(parsed.hasPosition).toBe(true);
        expect(parsed.topics).toEqual(['worldcup', 'polymarket', 'polymarket/event', 'polymarket/position']);
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
    test('event slug wins over multi-segment position-field item tags (FW-7899)', () => {
        // Exact tag set from the FW-7899 bug report: a direct event-slug item key plus
        // four position-field item tags emitted by another Firefly client. Previously
        // the last item tag (`outcome/0`) overwrote the slug.
        const parsed = parseLpt1Tags([
            LPT1_APP_TAG,
            LPT1_TOPIC_POLYMARKET,
            LPT1_TOPIC_POLYMARKET_EVENT,
            LPT1_TOPIC_POLYMARKET_POSITION,
            LPT1_SOURCE_POLYMARKET,
            lpt1ItemTag('fifwc-nor-eng-2026-07-11'),
            'lpt1/item/marketId/2815607',
            'lpt1/item/shares/2.8169',
            'lpt1/item/price/35.49',
            'lpt1/item/outcome/0',
        ]);
        expect(parsed.eventSlug).toBe('fifwc-nor-eng-2026-07-11');
        expect(parsed.eventSlug).not.toBe('outcome/0');
        expect(parsed.hasPosition).toBe(true);
    });
    test('event slug beats short team-code item keys — longest direct key wins (Orb producer)', () => {
        // Real Orb (`lpt1/app/orb`) tag set: short team-code item keys (`nor`, `eng`) are
        // emitted BEFORE the full event slug. The slug is the longest single-segment item
        // key, so it must win (otherwise the "View game" link points at `/polymarket/event/nor`).
        const parsed = parseLpt1Tags([
            'football-game:world-cup-2026-099',
            'worldcup',
            'fifa-bot',
            'prediction-won',
            'lpt1/app/orb',
            'lpt1/topic/sports',
            'lpt1/topic/sports/football',
            'lpt1/source/football-team',
            'lpt1/item/nor',
            'lpt1/item/eng',
            'lpt1/topic/polymarket',
            'lpt1/topic/polymarket/event',
            'lpt1/source/polymarket',
            'lpt1/item/fifwc-nor-eng-2026-07-11',
        ]);
        expect(parsed.eventSlug).toBe('fifwc-nor-eng-2026-07-11');
        expect(parsed.eventSlug).not.toBe('nor');
        expect(parsed.app).toBe('orb');
    });
    test('returns empty result for no tags', () => {
        expect(parseLpt1Tags([])).toEqual({ topics: [], hasPosition: false });
        expect(parseLpt1Tags(undefined)).toEqual({ topics: [], hasPosition: false });
    });
});

describe('truncatedDecimalString (iOS parity)', () => {
    test('truncates toward zero, not rounds (7th digit dropped)', () => {
        expect(truncatedDecimalString(100.259999)).toBe('100.259999'); // 6 digits, unchanged
        expect(truncatedDecimalString(100.2599999)).toBe('100.259999'); // 7th digit truncated, not rounded
        expect(truncatedDecimalString(1234.5678901)).toBe('1234.56789'); // truncated to 6 fraction digits
    });
    test('no thousands grouping, no trailing zeros, en-US decimal dot', () => {
        expect(truncatedDecimalString(0.655 * 100)).toBe('65.5'); // no trailing .0
        expect(truncatedDecimalString(0.5 * 100)).toBe('50');
        expect(truncatedDecimalString(0.37 * 100)).toBe('37');
        expect(truncatedDecimalString(1234.5)).toBe('1234.5'); // no grouping separator
        expect(truncatedDecimalString(2.8169)).toBe('2.8169');
    });
    test('zero and sub-epsilon values collapse to 0', () => {
        expect(truncatedDecimalString(0)).toBe('0');
        expect(truncatedDecimalString(0.0000009)).toBe('0'); // below 1e-6 truncates to 0
        expect(truncatedDecimalString(0.000001)).toBe('0.000001'); // exactly 1e-6 kept
    });
    test('accepts string-coercible numeric input via Number()', () => {
        // buildLpt1PositionTags passes Number(pos.shares); confirm the helper itself
        // takes a number. String inputs are converted at the call site.
        expect(truncatedDecimalString(Number('12.5'))).toBe('12.5');
    });
});

describe('buildLpt1PositionTags (iOS-style data tags, LPT-1 §4)', () => {
    test('emits source + item tags in iOS order, fraction→cents, outcome 0|1', () => {
        const tags = buildLpt1PositionTags({
            conditionId: '0xcond',
            outcome: 'Yes',
            outcomeIndex: 0,
            shares: 2.8169,
            price: 0.3549,
            marketId: '2815607',
        });
        expect(tags).toEqual([
            LPT1_SOURCE_POLYMARKET_POSITION,
            'lpt1/item/marketId/2815607',
            'lpt1/item/shares/2.8169',
            'lpt1/item/price/35.49', // 0.3549 × 100
            'lpt1/item/outcome/0',
        ]);
    });
    test('omits the marketId tag when marketId is absent (iOS conditional emission)', () => {
        const tags = buildLpt1PositionTags({
            conditionId: '0xcond',
            outcome: 'No',
            outcomeIndex: 1,
            shares: 100,
            price: 0.655,
        });
        expect(tags).not.toContainEqual(expect.stringContaining('item/marketId/'));
        expect(tags).toEqual([
            LPT1_SOURCE_POLYMARKET_POSITION,
            'lpt1/item/shares/100',
            'lpt1/item/price/65.5', // 0.655 × 100
            'lpt1/item/outcome/1',
        ]);
    });
    test('collapses any non-zero outcomeIndex to 1 (iOS parity)', () => {
        const odd = buildLpt1PositionTags({
            conditionId: 'c',
            outcome: 'X',
            outcomeIndex: 2,
            shares: 1,
            price: 0.5,
        });
        expect(odd).toContain('lpt1/item/outcome/1');
    });
    test('truncates share/price values toward zero (not round)', () => {
        const tags = buildLpt1PositionTags({
            conditionId: 'c',
            outcome: 'Yes',
            outcomeIndex: 0,
            shares: 100.2599999,
            price: 0.123456789, // × 100 = 12.3456789 → 12.345678 (truncated)
        });
        expect(tags).toContain('lpt1/item/shares/100.259999');
        expect(tags).toContain('lpt1/item/price/12.345678');
    });
    test('every produced tag is ≤50 chars, ASCII, and round-trips through the consumer', () => {
        // The marketId tag is intentionally camelCase (uppercase `I`) to match
        // iOS/Orb, so it is NOT strict-grammar-valid — but it must still satisfy
        // the universal length/ASCII invariants and be readable back.
        const tags = buildLpt1PositionTags({
            conditionId: 'c',
            outcome: 'Yes',
            outcomeIndex: 0,
            shares: 2.8169,
            price: 0.3549,
            marketId: '2815607',
        });
        for (const tag of tags) {
            expect(tag.length).toBeLessThanOrEqual(LPT1_MAX_TAG_LENGTH);
            expect(tag.startsWith('lpt1/')).toBe(true);

            for (let i = 0; i < tag.length; i += 1) expect(tag.charCodeAt(i)).toBeLessThanOrEqual(127);
        }

        // the shares/price/outcome/source tags (no camelCase) ARE grammar-valid.
        expect(isValidLpt1Tag('lpt1/item/shares/2.8169')).toBe(true);
        expect(isValidLpt1Tag('lpt1/item/price/35.49')).toBe(true);
        expect(isValidLpt1Tag(LPT1_SOURCE_POLYMARKET_POSITION)).toBe(true);
        // round-trips through the tag-encoded position consumer.
        expect(readLpt1PositionFromTags(tags)?.marketId).toBe('2815607');
    });
    test('clamps a pathologically long marketId to the 50-char tag ceiling', () => {
        const tags = buildLpt1PositionTags({
            conditionId: 'c',
            outcome: 'Yes',
            outcomeIndex: 0,
            shares: 1,
            price: 0.5,
            marketId: '1'.repeat(80),
        });
        const marketTag = tags.find((t) => t.startsWith('lpt1/item/marketId/'))!;
        expect(marketTag.length).toBe(LPT1_MAX_TAG_LENGTH);
        // clamped tag still carries the prefix.
        expect(marketTag.startsWith('lpt1/item/marketId/')).toBe(true);
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

describe('readLpt1PositionFromTags (tag-encoded position fallback, FW-7899)', () => {
    const positionTags = [
        'lpt1/item/marketId/2815607',
        'lpt1/item/shares/2.8169',
        'lpt1/item/price/35.49',
        'lpt1/item/outcome/0',
    ];

    test('parses the four position fields from item tags', () => {
        const position = readLpt1PositionFromTags(positionTags);
        expect(position).not.toBeNull();
        // tag-encoded positions carry no conditionId / outcome label.
        expect(position?.conditionId).toBe('');
        expect(position?.outcome).toBe('');
        expect(position?.outcomeIndex).toBe(0);
        expect(position?.shares).toBeCloseTo(2.8169, 10);
        expect(position?.price).toBeCloseTo(0.3549, 10); // cents (35.49) → fraction
        expect(position?.marketId).toBe('2815607');
    });

    test('normalises price from cents (0–100) to a 0–1 fraction', () => {
        expect(readLpt1PositionFromTags(['lpt1/item/price/35.49'])?.price).toBeCloseTo(0.3549, 10);
        expect(readLpt1PositionFromTags(['lpt1/item/price/0'])?.price).toBe(0);
        expect(readLpt1PositionFromTags(['lpt1/item/price/100'])?.price).toBe(1);
    });

    test('reads the No/away outcome index', () => {
        expect(readLpt1PositionFromTags(['lpt1/item/outcome/1'])?.outcomeIndex).toBe(1);
    });

    test('returns null when no position item tags are present', () => {
        expect(readLpt1PositionFromTags([])).toBeNull();
        expect(readLpt1PositionFromTags(undefined)).toBeNull();
        expect(readLpt1PositionFromTags([LPT1_APP_TAG, LPT1_TOPIC_POLYMARKET])).toBeNull();
    });

    test('ignores the event-slug item key and hashed h/… keys', () => {
        // event slug = single segment (no '/'); hashed = h/… — neither is a position field.
        expect(
            readLpt1PositionFromTags([
                lpt1ItemTag('fifwc-nor-eng-2026-07-11'),
                'lpt1/item/h/qzltb22lvj4jtk2f2x7umzo2oz',
                LPT1_APP_TAG,
            ]),
        ).toBeNull();
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
