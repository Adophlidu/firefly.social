import { MetadataAttributeType } from '@dimensiondev/enums';
import { describe, expect, test } from 'vitest';

import type { MetadataAttribute } from '@/providers/lens/metadata/Base.js';
import { createLensPostMetadata } from '@/providers/lens/postToLens.js';

describe('createLensPostMetadata', () => {
    test('omits attributes/tags when none provided (no min(1) validation failure)', () => {
        const meta = createLensPostMetadata({ title: 'Post by #foo', content: 'hello' });

        expect(meta.lens.attributes).toBeUndefined();
        expect(meta.lens.tags).toBeUndefined();
    });

    test('coerces an empty attributes array to undefined (FW-7852: [] failed .min(1))', () => {
        // An Orb comment without a position seeds lpt1Attributes to EMPTY_LIST ([]).
        // The Lens schema rejects attributes: [] (min 1), so it must be omitted.
        const meta = createLensPostMetadata({
            title: 'Post by #foo',
            content: 'hello',
            attributes: [],
            tags: [],
        });

        expect(meta.lens.attributes).toBeUndefined();
        expect(meta.lens.tags).toBeUndefined();
    });

    test('passes non-empty attributes through', () => {
        const attributes: MetadataAttribute[] = [
            { key: 'lpt1_price', type: MetadataAttributeType.NUMBER, value: '0.62' },
            { key: 'lpt1_outcome', type: MetadataAttributeType.STRING, value: 'Yes' },
        ];

        const meta = createLensPostMetadata({ title: 'Post by #foo', content: 'hello', attributes });

        expect(meta.lens.attributes).toEqual(attributes);
    });

    test('passes non-empty tags through (order preserved; duplicates are rejected by the schema)', () => {
        const meta = createLensPostMetadata({
            title: 'Post by #foo',
            content: 'hello',
            tags: ['lpt1', 'worldcup'],
        });

        expect(meta.lens.tags).toEqual(['lpt1', 'worldcup']);
    });

    test('rejects duplicate tags (the schema is strict — buildLpt1Tags dedupes for this reason)', () => {
        expect(() =>
            createLensPostMetadata({ title: 'Post by #foo', content: 'hello', tags: ['lpt1', 'lpt1'] }),
        ).toThrow();
    });
});
