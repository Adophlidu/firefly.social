import { MetadataAttributeType } from '@dimensiondev/enums';

import { FIFA_SLUG } from '@/constants/bets.js';
import type { MetadataAttribute } from '@/providers/lens/metadata/Base.js';

/**
 * Lens Post Tag Protocol (LPT-1) producer/consumer helpers.
 *
 * An "Orb comment" is a Lens ROOT post carrying LPT-1 tags (machine-readable
 * event/source/item classification) plus optional position `attributes`. Tags
 * are queryable; position data lives in BOTH the tags (iOS-style data-bearing
 * `lpt1/item/{field}/{value}` tags, so iOS/Orb can render the position pill) and
 * `attributes[]` (which also carries `conditionId` the tag format cannot encode,
 * and which web's `PositionBadge` reads first as a fast path).
 *
 * Spec: "Lens Post Tag Protocol Specification" (draft 0.1). Position data tags
 * follow the spec's §4 example and the iOS/Orb producer exactly, so posts are
 * mutually readable across web / iOS / Orb.
 */

// ---- Grammar (spec §9, §10, §11) --------------------------------------------------

/** Max characters in a complete tag (spec §5, §11). */
export const LPT1_MAX_TAG_LENGTH = 50;
/** Max unique tags in one post's metadata (spec §5). */
export const LPT1_MAX_TAGS = 20;
/** Max length of a direct item key (spec §9 — prefix `lpt1/item/` is 10 chars). */
export const LPT1_DIRECT_ITEM_KEY_MAX_LENGTH = 40;
/** Max length of an app slug (spec §9 — prefix `lpt1/app/` is 9 chars: 50−9). */
export const LPT1_APP_SLUG_MAX_LENGTH = 41;
/** Max length of a source slug (spec §9 — prefix `lpt1/source/` is 12 chars: 50−12). */
export const LPT1_SOURCE_SLUG_MAX_LENGTH = 38;
/** Max length of a complete topic path, including `/` delimiters (spec §9 — `lpt1/topic/` is 11: 50−11). */
export const LPT1_TOPIC_PATH_MAX_LENGTH = 39;

/** A normal segment: `[a-z0-9]+(?:[-_][a-z0-9]+)*` (spec §9). */
const SEGMENT_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/u;
/** A hashed item key: literal `h/` + exactly 26 RFC-4648 lowercase Base32 chars (spec §7, §14). */
const HASHED_ITEM_KEY_PATTERN = /^h\/[a-z2-7]{26}$/u;
/** Length of the Base32 portion of a hashed item key (spec §14). */
const LPT1_HASHED_KEY_LENGTH = 26;
/** RFC-4648 lowercase Base32 alphabet (spec §7). */
const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

// ---- Protocol tag constants -------------------------------------------------------

/** Bare protocol version marker. */
export const LPT1_ROOT_TAG = 'lpt1';
export const LPT1_PREFIX = 'lpt1/';
export const LPT1_APP_TAG = 'lpt1/app/firefly';
/** FIFA World Cup topic. Matches iOS/Orb (`lpt1/topic/worldcup`); the Home World Cup feed queries the bare `worldcup` tag, not this namespaced topic. */
export const LPT1_TOPIC_WORLDCUP = 'lpt1/topic/worldcup';
export const LPT1_TOPIC_POLYMARKET = 'lpt1/topic/polymarket';
/** Topic path used by the event-scoped Comments query (`lpt1/topic/` prefix omitted). */
export const LPT1_EVENT_TOPIC = 'polymarket/event';
export const LPT1_TOPIC_POLYMARKET_EVENT = `lpt1/topic/${LPT1_EVENT_TOPIC}`;
/** Signal flag: the author holds a position in the event. */
export const LPT1_POSITION_TOPIC = 'polymarket/position';
export const LPT1_TOPIC_POLYMARKET_POSITION = `lpt1/topic/${LPT1_POSITION_TOPIC}`;
export const LPT1_SOURCE_POLYMARKET = 'lpt1/source/polymarket';
/**
 * Position-specific source tag emitted alongside the position data item tags
 * (`lpt1/item/{marketId|shares|price|outcome}/…`). Matches the iOS/Orb producer
 * (Mask-X-iOS RN bundle) so web-published positions are readable cross-app.
 */
export const LPT1_SOURCE_POLYMARKET_POSITION = 'lpt1/source/polymarket/position';

/**
 * Non-LPT-1 interop tag. Orb publishes World Cup posts with this bare tag, so we
 * emit it too — both apps' posts are then discoverable via the same `worldcup` tag
 * (spec §1 allows coexistence with ordinary, non-protocol tags; §18.11 orders
 * them last).
 */
export const WORLD_CUP_TAG = 'worldcup';

// ---- Attribute keys (metadata `attributes[]`) -------------------------------------

/**
 * Attribute keys are namespaced `lpt1_*` so they never collide with unrelated
 * attributes on the same post. Values are always strings (Lens stores even
 * NUMBER attributes as strings).
 */
const ATTR_CONDITION_ID = 'lpt1_conditionId';
const ATTR_OUTCOME = 'lpt1_outcome';
const ATTR_OUTCOME_INDEX = 'lpt1_outcomeIndex';
const ATTR_SHARES = 'lpt1_shares';
const ATTR_PRICE = 'lpt1_price';
const ATTR_MARKET_ID = 'lpt1_marketId';

// ---- Validation -------------------------------------------------------------------

/** True when `key` is a valid LPT-1 *hashed* item key (`h/` + 26 Base32, spec §7, §14). */
export function isValidHashedItemKey(key: string): boolean {
    return HASHED_ITEM_KEY_PATTERN.test(key);
}

/** True when `key` is a valid LPT-1 *direct* item key (spec §13: a single segment,
 *  ≤40 chars, and not the reserved `h/`+26-Base32 hashed form). */
export function isValidDirectItemKey(key: string): boolean {
    if (!key) return false;
    if (key.length > LPT1_DIRECT_ITEM_KEY_MAX_LENGTH) return false;
    if (isValidHashedItemKey(key)) return false; // reserved hashed form (spec §8.11, §13)
    return SEGMENT_PATTERN.test(key);
}

/** True when `slug` is a valid LPT-1 app slug (segment, ≤41 chars, spec §9). */
export function isValidAppSlug(slug: string): boolean {
    if (!slug || slug.length > LPT1_APP_SLUG_MAX_LENGTH) return false;
    return SEGMENT_PATTERN.test(slug);
}

/** True when `slug` is a valid LPT-1 source slug (segment, ≤38 chars, spec §9). */
export function isValidSourceSlug(slug: string): boolean {
    if (!slug || slug.length > LPT1_SOURCE_SLUG_MAX_LENGTH) return false;
    return SEGMENT_PATTERN.test(slug);
}

/** True when `path` is a valid LPT-1 topic path: one or more `/`-separated
 *  segments, total ≤39 chars including delimiters (spec §9). */
export function isValidTopicPath(path: string): boolean {
    if (!path || path.length > LPT1_TOPIC_PATH_MAX_LENGTH) return false;
    const segments = path.split('/');
    return segments.length > 0 && segments.every((seg) => SEGMENT_PATTERN.test(seg));
}

/** True when `tag` satisfies the universal Lens tag rules (spec §5, §10): ≤50
 *  chars, lowercase ASCII, no whitespace. Applies to LPT-1 and non-protocol tags. */
function isValidGeneralTag(tag: string): boolean {
    if (typeof tag !== 'string') return false;
    if (!tag || tag.length > LPT1_MAX_TAG_LENGTH) return false;
    if (tag !== tag.toLowerCase()) return false; // lowercase ASCII (spec §10.2)
    if (tag !== tag.trim() || tag.includes(' ')) return false; // no whitespace (spec §10.12)

    // ASCII only (spec §10 + §23).
    for (let i = 0; i < tag.length; i += 1) {
        if (tag.charCodeAt(i) > 127) return false;
    }

    return true;
}

/** True when `tag` is a valid LPT-1 tag (general rules + `lpt1`/`lpt1/…` prefix). */
export function isValidLpt1Tag(tag: string): boolean {
    return isValidGeneralTag(tag) && (tag === LPT1_ROOT_TAG || tag.startsWith(LPT1_PREFIX));
}

/** True when the post carries LPT-1 tags (an Orb comment / World Cup post). */
export function isLpt1Post(tags?: string[] | null): boolean {
    return !!tags?.some((t) => t === LPT1_ROOT_TAG || t.startsWith(LPT1_PREFIX));
}

/** Build the item tag for a direct item key. */
export function lpt1ItemTag(eventSlug: string): string {
    return `${LPT1_PREFIX}item/${eventSlug}`;
}

/**
 * Lowercase unpadded RFC-4648 Base32 encoding (spec §7). No new dependency —
 * Web Crypto gives us the SHA-256 bytes; this turns them into the Base32 alphabet.
 */
function encodeBase32Unpadded(bytes: Uint8Array): string {
    // Bitwise ops are required to repack 8-bit bytes into 5-bit Base32 groups.
    /* eslint-disable no-bitwise */
    let bits = 0;
    let value = 0;
    let output = '';
    for (let i = 0; i < bytes.length; i += 1) {
        value = (value << 8) | bytes[i];
        bits += 8;

        while (bits >= 5) {
            output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
            bits -= 5;
        }
    }

    if (bits > 0) {
        output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
    }
    /* eslint-enable no-bitwise */
    return output;
}

/**
 * Build the hashed item tag for an external identifier (spec §14).
 *
 * `SHA-256(utf8(sourceSlug) ‖ 0x00 ‖ utf8(canonicalId))` → lowercase unpadded
 * RFC-4648 Base32 → first 26 chars → `lpt1/item/h/…`. The source slug is part of
 * the hash input, so the same id from different sources hashes differently.
 *
 * Async (Web Crypto `crypto.subtle.digest`). Use this when a canonical id is too
 * long or otherwise fails the direct item-key grammar; producers with a valid
 * ≤40-char direct key should use `lpt1ItemTag()` instead. `buildLpt1Tags` stays
 * synchronous and direct-key-only by design — this primitive is exported so it is
 * available and conformance-tested, and so the consumer recognizes `h/` hashed tags.
 */
export async function hashItemKey(sourceSlug: string, canonicalId: string): Promise<string> {
    const sourceBytes = new TextEncoder().encode(sourceSlug);
    const idBytes = new TextEncoder().encode(canonicalId);
    const input = new Uint8Array(sourceBytes.length + 1 + idBytes.length);
    input.set(sourceBytes, 0);
    input[sourceBytes.length] = 0x00; // null separator (spec §14)
    input.set(idBytes, sourceBytes.length + 1);

    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', input));
    const encoded = encodeBase32Unpadded(digest).slice(0, LPT1_HASHED_KEY_LENGTH);
    return `${LPT1_PREFIX}item/h/${encoded}`;
}

// ---- Producer: build tags ---------------------------------------------------------

/**
 * Cap a produced tag at the spec's 50-char ceiling (spec §5), matching the iOS
 * producer's `{truncate:!0}` behavior. Only long `marketId` values can approach
 * the limit in practice; `shares`/`price`/`outcome` values are always short.
 */
function clampTag(tag: string): string {
    return tag.length > LPT1_MAX_TAG_LENGTH ? tag.slice(0, LPT1_MAX_TAG_LENGTH) : tag;
}

/**
 * Truncate toward zero to ≤`maxFractionDigits` fraction digits, then format with
 * an en-US decimal dot — no thousands grouping, no trailing zeros. Mirrors iOS
 * `truncatedDecimalString` (Mask-X-iOS PolymarketDetailViewModel+Comments.swift:68-79)
 * so web-published position tag values are byte-identical to iOS/Orb: both use
 * IEEE-754 doubles and the same truncation, so the outputs match by construction.
 */
export function truncatedDecimalString(value: number, maxFractionDigits = 6): string {
    if (!Number.isFinite(value)) return '0';
    const multiplier = Math.pow(10, maxFractionDigits);
    const truncated = Math.trunc(value * multiplier) / multiplier; // toward zero (iOS .rounded(.towardZero))
    return truncated.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxFractionDigits,
        useGrouping: false,
    });
}

export interface BuildLpt1TagsOptions {
    /** Event slug = the detail-page route param `[id]` (a valid direct item key). */
    eventSlug: string;
    /** True when the author holds a position in the event (emits the position signal tag). */
    hasPosition?: boolean;
    /**
     * The author's position in the event. When present, emits the iOS-style
     * data-bearing position tags (`lpt1/source/polymarket/position` +
     * `lpt1/item/{marketId|shares|price|outcome}/…`) so iOS/Orb can render the
     * position pill on web-published comments. Implies `hasPosition`.
     */
    position?: Lpt1PositionInput;
    /**
     * Emit the `lpt1/topic/worldcup` topic + the bare `worldcup` interop tag.
     * Only FIFA World Cup events should set this — the Home World Cup feed
     * queries the bare `worldcup` tag, so attaching it to non-FIFA comments
     * would pollute that feed.
     */
    includeWorldCup?: boolean;
}

/**
 * Build the ordered, parent-closed, de-duplicated, validated tag set for a
 * Polymarket Orb comment (spec §13 parent closure, §18.11 ordering).
 *
 * Emits the LPT-1 base set (+`lpt1/topic/polymarket/position` when `hasPosition`).
 * When `position` is present, also emits the iOS-style data-bearing position tags
 * (`buildLpt1PositionTags`) right after the event-slug item, matching the iOS/Orb
 * tag order. When `includeWorldCup` is true, also emits `lpt1/topic/worldcup` and
 * the non-protocol `worldcup` interop tag (FIFA events only).
 * Throws on an invalid event slug — a producer MUST NOT publish invalid base tags
 * (spec §18.7), and our route slugs are always valid direct keys. Position data
 * tags are clamped + de-duped but intentionally skip the strict grammar check
 * (they carry a camelCase `marketId` to match iOS/Orb byte-for-byte).
 */
export function buildLpt1Tags({
    eventSlug,
    hasPosition = false,
    position,
    includeWorldCup = false,
}: BuildLpt1TagsOptions): string[] {
    if (!isValidDirectItemKey(eventSlug)) {
        throw new Error(`Invalid LPT-1 event slug (direct item key): "${eventSlug}"`);
    }

    const withPosition = hasPosition || !!position;
    const seen = new Set<string>();
    const tags: string[] = [];

    /** Grammar-validate (a producer MUST NOT publish invalid base tags, spec §18.7), then de-dupe. */
    const pushBase = (tag: string) => {
        const valid =
            tag === LPT1_ROOT_TAG || tag.startsWith(LPT1_PREFIX) ? isValidLpt1Tag(tag) : isValidGeneralTag(tag);
        if (!valid) throw new Error(`Invalid tag produced: "${tag}"`);
        if (seen.has(tag)) return; // de-dupe preserving order (spec §5 uniqueness)
        seen.add(tag);
        tags.push(tag);
    };
    /**
     * De-dupe only — no grammar check. The iOS-style position data tags carry a
     * camelCase `marketId` field name and decimal values that the strict lowercase
     * grammar rejects, but iOS/Orb emit exactly these strings (and do not grammar-
     * validate either). To be readable cross-app, web must emit byte-identical
     * tags; `buildLpt1PositionTags` already clamps each to ≤50 chars.
     */
    const pushPosition = (tag: string) => {
        if (seen.has(tag)) return;
        seen.add(tag);
        tags.push(tag);
    };

    // 1. Base LPT-1 set (grammar-validated), parent-closed, broadest→specific.
    //    When `position` data is present, the position signal topic is emitted in
    //    the contiguous block below (iOS's state-machine consumer requires
    //    topic/position immediately followed by source/position). The signal-only
    //    path (`hasPosition` without data) keeps the topic here.
    pushBase(LPT1_ROOT_TAG);
    pushBase(LPT1_APP_TAG);
    if (includeWorldCup) pushBase(LPT1_TOPIC_WORLDCUP);
    pushBase(LPT1_TOPIC_POLYMARKET);
    pushBase(LPT1_TOPIC_POLYMARKET_EVENT);
    if (withPosition && !position) pushBase(LPT1_TOPIC_POLYMARKET_POSITION);
    pushBase(LPT1_SOURCE_POLYMARKET);
    pushBase(lpt1ItemTag(eventSlug));

    // 2. iOS-style position block (CONTIGUOUS): topic/polymarket/position →
    //    source/polymarket/position → lpt1/item/{marketId|shares|price|outcome}.
    //    iOS's consumer (RN `parseLensTags`) enters the data section ONLY when
    //    `lpt1/source/polymarket/position` immediately follows
    //    `lpt1/topic/polymarket/position` with no intervening topic/source tag in
    //    between (any `lpt1/topic/…` or `lpt1/source/…` resets its state) — so this
    //    block MUST stay together, after the event-slug item (matching the iOS
    //    producer's order). Position tags are clamped + de-duped but NOT grammar-
    //    validated (the camelCase `marketId` matches iOS byte-for-byte).
    if (position) {
        pushBase(LPT1_TOPIC_POLYMARKET_POSITION);

        for (const tag of buildLpt1PositionTags(position)) pushPosition(tag);
    }

    // 3. Non-protocol interop tag last (spec §18.11: ordinary tags last).
    if (includeWorldCup) pushBase(WORLD_CUP_TAG);

    if (tags.length > LPT1_MAX_TAGS) {
        throw new Error(`LPT-1 tag count ${tags.length} exceeds limit of ${LPT1_MAX_TAGS}`);
    }
    return tags;
}

// ---- Consumer: parse tags ---------------------------------------------------------

export interface ParsedLpt1Tags {
    app?: string;
    source?: string;
    /** Event slug parsed from the (direct) item tag, if present. */
    eventSlug?: string;
    /** Topic paths in declared order (without the `lpt1/topic/` prefix). */
    topics: string[];
    /** True when the position signal topic is present. */
    hasPosition: boolean;
}

/**
 * Parse LPT-1 tags back into a structured shape (spec §19). Only tags beginning
 * with `lpt1/` (plus the bare `lpt1` marker) are interpreted; malformed tags are
 * ignored without rejecting the post (spec §19.7, §19.10).
 */
export function parseLpt1Tags(tags?: string[] | null): ParsedLpt1Tags {
    const result: ParsedLpt1Tags = { topics: [], hasPosition: false };
    if (!tags || tags.length === 0) return result;

    let itemKey: string | undefined;
    for (const tag of tags) {
        if (typeof tag !== 'string') continue;
        if (tag === LPT1_ROOT_TAG) continue;
        if (!tag.startsWith(LPT1_PREFIX)) continue; // not an LPT-1 tag

        const body = tag.slice(LPT1_PREFIX.length);
        const slash = body.indexOf('/');
        if (slash === -1) continue; // e.g. "lpt1/app" with no slug — malformed, skip
        const kind = body.slice(0, slash);
        const rest = body.slice(slash + 1);
        if (!rest) continue;

        switch (kind) {
            case 'app':
                result.app = rest;
                break;
            case 'source':
                result.source = rest;
                break;
            case 'topic':
                result.topics.push(rest);
                if (rest === LPT1_POSITION_TOPIC) result.hasPosition = true;
                break;
            case 'item':
                // The event slug is a direct item key — a single segment with no '/' (spec §13).
                // Multi-segment item tags (`lpt1/item/{marketId|shares|price|outcome}/…`) and
                // hashed `h/…` keys are not event slugs. Some producers (e.g. `lpt1/app/orb`)
                // ALSO emit short team-code item keys (`nor`, `eng`, `arg`, …) alongside the
                // full event slug; the slug is always the longest direct item key, so prefer it
                // (first-encountered wins on ties).
                if (!rest.startsWith('h/') && !rest.includes('/')) {
                    if (itemKey === undefined || rest.length > itemKey.length) {
                        itemKey = rest;
                    }
                }
                break;
            default:
                break;
        }
    }

    if (itemKey) result.eventSlug = itemKey;
    return result;
}

// ---- Producer/consumer: position attributes ---------------------------------------

export interface Lpt1PositionInput {
    conditionId: string;
    /** Outcome label, e.g. "Yes" or a team name. */
    outcome: string;
    /** Outcome side: 0 = Yes/home, 1 = No/away. */
    outcomeIndex: number;
    shares: number | string;
    price: number | string;
    marketId?: string;
}

export interface Lpt1PositionOutput {
    conditionId: string;
    outcome: string;
    outcomeIndex: number;
    shares: number;
    price: number;
    marketId?: string;
}

/** Build the position `attributes[]` for an Orb comment (producer side). */
export function buildLpt1PositionAttributes(pos: Lpt1PositionInput): MetadataAttribute[] {
    const attributes: MetadataAttribute[] = [
        { key: ATTR_CONDITION_ID, type: MetadataAttributeType.STRING, value: pos.conditionId },
        { key: ATTR_OUTCOME, type: MetadataAttributeType.STRING, value: pos.outcome },
        { key: ATTR_OUTCOME_INDEX, type: MetadataAttributeType.NUMBER, value: String(pos.outcomeIndex) },
        { key: ATTR_SHARES, type: MetadataAttributeType.NUMBER, value: String(pos.shares) },
        { key: ATTR_PRICE, type: MetadataAttributeType.NUMBER, value: String(pos.price) },
    ];
    if (pos.marketId) {
        attributes.push({ key: ATTR_MARKET_ID, type: MetadataAttributeType.STRING, value: pos.marketId });
    }
    return attributes;
}

/**
 * Build the `{ lpt1Tags, lpt1Attributes }` payload for any Orb (LPT-1) compose
 * surface — root comments (`openOrbCommentCompose`) and replies
 * (`OrbCommentCell` → reply action). Centralizing the position encoding keeps
 * the two surfaces from drifting.
 *
 * `scope`:
 * - `'root'` (default) — a top-level Orb comment: the full event-scoped tag set
 *   (event item + polymarket source + event topic, plus the World Cup interop
 *   tag for FIFA slugs) so the post is discoverable in the event Comments tab
 *   and the Home World Cup feed.
 * - `'reply'` — a comment-of-comment: the position block ONLY (see
 *   `buildLpt1ReplyTags`). A reply inherits event scoping from its parent (Lens
 *   `commentOn`) and is nested under it by `OrbReplies` (parent-child fetch), so
 *   it must NOT carry the event/worldcup discovery tags — otherwise it matches
 *   the event Comments query / the World Cup feed and renders as a standalone
 *   root post instead of nesting.
 *
 * `lpt1Attributes` (read first by web's `PositionBadge`) is `undefined` when
 * there is no position.
 */
export function buildOrbComposePayload({
    eventSlug,
    position,
    scope = 'root',
}: {
    eventSlug: string;
    position?: Lpt1PositionInput | null;
    scope?: 'root' | 'reply';
}): {
    lpt1Tags: string[];
    lpt1Attributes: MetadataAttribute[] | undefined;
} {
    const lpt1Attributes = position ? buildLpt1PositionAttributes(position) : undefined;
    if (scope === 'reply') {
        return {
            lpt1Tags: position ? buildLpt1ReplyTags(position) : [],
            lpt1Attributes,
        };
    }
    return {
        lpt1Tags: buildLpt1Tags({
            eventSlug,
            hasPosition: !!position,
            position: position ?? undefined,
            includeWorldCup: eventSlug.startsWith(FIFA_SLUG),
        }),
        lpt1Attributes,
    };
}

/**
 * Build the LPT-1 tag set for an Orb comment REPLY (comment-of-comment): the
 * position block ONLY — root marker + app + the `polymarket` parent topic (spec
 * §13 parent closure for `polymarket/position`) + the contiguous iOS-style
 * position signal/data block (`polymarket/position` → `source/polymarket/
 * position` → `lpt1/item/{marketId|shares|price|outcome}/…`).
 *
 * Deliberately OMITS the event-discovery tags (`lpt1/topic/polymarket/event`,
 * `lpt1/source/polymarket`, `lpt1/item/{eventSlug}`) and the `worldcup`
 * interop tag. A reply is scoped to its event through its parent (`commentOn`)
 * and is nested under that parent by `OrbReplies` (parent-child fetch), so
 * carrying the discovery tags would make it match `getLensPostsByLpt1Item`
 * (event Comments) and `getLensWorldCupPosts` (Home World Cup feed, which
 * queries the bare `worldcup` tag) and render as a standalone root post. The
 * position block alone is all iOS/Orb and web need to render the reply's pill.
 */
export function buildLpt1ReplyTags(position: Lpt1PositionInput): string[] {
    const seen = new Set<string>();
    const tags: string[] = [];
    const push = (tag: string) => {
        if (seen.has(tag)) return; // de-dupe preserving order (spec §5 uniqueness)
        seen.add(tag);
        tags.push(tag);
    };

    push(LPT1_ROOT_TAG);
    push(LPT1_APP_TAG);
    push(LPT1_TOPIC_POLYMARKET); // parent closure for polymarket/position (spec §13)
    // Contiguous position block: topic → source → item data (iOS state-machine order).
    push(LPT1_TOPIC_POLYMARKET_POSITION);

    for (const tag of buildLpt1PositionTags(position)) push(tag);

    if (tags.length > LPT1_MAX_TAGS) {
        throw new Error(`LPT-1 tag count ${tags.length} exceeds limit of ${LPT1_MAX_TAGS}`);
    }
    return tags;
}

/**
 * Build the iOS-style data-bearing position tags (LPT-1 spec §4 position example).
 * Returned in this exact order to match the iOS/Orb producer
 * (Mask-X-iOS PolymarketDetailViewModel+Comments.swift:48-66):
 *
 *   1. `lpt1/source/polymarket/position`
 *   2. `lpt1/item/marketId/{marketId}` — only when `marketId` is present (iOS emits conditionally)
 *   3. `lpt1/item/shares/{shares}` — decimal, truncated toward zero to 6 digits
 *   4. `lpt1/item/price/{price}` — fraction (0–1) → cents (0–100), truncated toward zero
 *   5. `lpt1/item/outcome/{0|1}` — outcome index collapsed to 0 (Yes) or 1 (No), per iOS
 *
 * Each value tag is clamped to the spec's 50-char ceiling (iOS `{truncate:!0}`).
 * The consumer `readLpt1PositionFromTags` reads these back; web's own
 * `PositionBadge` reads `attributes` first (unchanged), so emitting both is harmless.
 */
export function buildLpt1PositionTags(pos: Lpt1PositionInput): string[] {
    const outcome = pos.outcomeIndex === 0 ? '0' : '1'; // iOS collapses to 0|1
    return [
        LPT1_SOURCE_POLYMARKET_POSITION,
        ...(pos.marketId ? [clampTag(`${LPT1_PREFIX}item/marketId/${pos.marketId}`)] : []),
        clampTag(`${LPT1_PREFIX}item/shares/${truncatedDecimalString(Number(pos.shares))}`),
        clampTag(`${LPT1_PREFIX}item/price/${truncatedDecimalString(Number(pos.price) * 100)}`),
        clampTag(`${LPT1_PREFIX}item/outcome/${outcome}`),
    ];
}

function readNumberAttribute(attributes: MetadataAttribute[], key: string): number {
    const value = attributes.find((a) => a.key === key)?.value;
    if (value === undefined) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

/** Read position data back from `attributes[]` (consumer side). Returns null if absent. */
export function readLpt1Position(attributes?: MetadataAttribute[] | null): Lpt1PositionOutput | null {
    if (!attributes || attributes.length === 0) return null;
    const read = (key: string) => attributes.find((a) => a.key === key)?.value;
    const conditionId = read(ATTR_CONDITION_ID);
    if (!conditionId) return null;

    const marketId = read(ATTR_MARKET_ID);
    return {
        conditionId,
        outcome: read(ATTR_OUTCOME) ?? '',
        outcomeIndex: readNumberAttribute(attributes, ATTR_OUTCOME_INDEX),
        shares: readNumberAttribute(attributes, ATTR_SHARES),
        price: readNumberAttribute(attributes, ATTR_PRICE),
        ...(marketId ? { marketId } : {}),
    };
}

/**
 * Tag-encoded position field keys. Some Firefly clients (e.g. `lpt1/app/firefly`)
 * emit the position as `lpt1/item/{field}/{value}` tags instead of as metadata
 * `attributes[]`; these constants identify those fields. Local to this reader.
 */
const TAG_POSITION_FIELD_MARKET_ID = 'marketId';
const TAG_POSITION_FIELD_SHARES = 'shares';
const TAG_POSITION_FIELD_PRICE = 'price';
const TAG_POSITION_FIELD_OUTCOME = 'outcome';

/**
 * Read position data from `lpt1/item/{field}/{value}` tags (consumer side, fallback
 * encoding used by some producers). Tolerates posts that encode the position as item
 * tags rather than as metadata `attributes`.
 *
 * The event-slug item key (a single segment, no `/`) and hashed `h/…` keys are
 * ignored — only multi-segment `lpt1/item/{field}/{value}` tags are read, first
 * value per field wins. Returns null when no position item tags are present.
 *
 * Tag-encoded positions carry no `conditionId` and no outcome *label* (only the 0/1
 * index), so `conditionId` is `''` and `outcome` is `''` — callers default to
 * `Yes`/`No` from `outcomeIndex`. `price` is encoded as cents (0–100) and normalized
 * to the 0–1 fraction used elsewhere.
 */
export function readLpt1PositionFromTags(tags?: string[] | null): Lpt1PositionOutput | null {
    if (!tags || tags.length === 0) return null;

    let marketId: string | undefined;
    let outcomeIndex: number | undefined;
    let shares: number | undefined;
    let priceCents: number | undefined;

    for (const tag of tags) {
        if (typeof tag !== 'string') continue;
        if (!tag.startsWith(LPT1_PREFIX)) continue; // not an LPT-1 tag
        const body = tag.slice(LPT1_PREFIX.length);
        if (!body.startsWith('item/')) continue;
        const rest = body.slice('item/'.length);
        if (!rest) continue;
        const slash = rest.indexOf('/');
        if (slash === -1) continue; // the event-slug item key (single segment) — not a position field
        const field = rest.slice(0, slash);
        const value = rest.slice(slash + 1);
        if (!value) continue;

        switch (field) {
            case TAG_POSITION_FIELD_MARKET_ID:
                if (marketId === undefined) marketId = value;
                break;
            case TAG_POSITION_FIELD_OUTCOME: {
                if (outcomeIndex === undefined) {
                    const parsed = Number(value);
                    if (Number.isFinite(parsed)) outcomeIndex = parsed;
                }
                break;
            }
            case TAG_POSITION_FIELD_SHARES: {
                if (shares === undefined) {
                    const parsed = Number(value);
                    if (Number.isFinite(parsed)) shares = parsed;
                }
                break;
            }
            case TAG_POSITION_FIELD_PRICE: {
                if (priceCents === undefined) {
                    const parsed = Number(value);
                    if (Number.isFinite(parsed)) priceCents = parsed;
                }
                break;
            }
            default:
                break; // `h/…` hashed keys and any unknown field are ignored
        }
    }

    // No position fields found → not a tag-encoded position.
    if (shares === undefined && priceCents === undefined && outcomeIndex === undefined && marketId === undefined) {
        return null;
    }

    return {
        conditionId: '',
        outcome: '',
        outcomeIndex: outcomeIndex ?? 0,
        shares: shares ?? 0,
        price: (priceCents ?? 0) / 100, // cents (0–100) → fraction (0–1)
        ...(marketId ? { marketId } : {}),
    };
}

// ---- Query builders ---------------------------------------------------------------

/** Tags for the event-scoped Comments-tab query (`fetchPosts` `tags.all`). */
export function lpt1EventQueryTags(eventSlug: string): string[] {
    return [LPT1_TOPIC_POLYMARKET_EVENT, LPT1_SOURCE_POLYMARKET, lpt1ItemTag(eventSlug)];
}
