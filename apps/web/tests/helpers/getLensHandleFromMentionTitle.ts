import { describe, expect, test } from 'vitest';

import { getLensHandleFromMentionTitle } from '@/providers/lens/getLensHandleFromMentionTitle.js';

describe('getLensHandleFromMentionTitle', () => {
    test('should return lens handle', () => {
        const cases = [
            ['@lens/handle', 'handle'],
            ['@handle.lens', 'handle'],
            ['@fireflyapp', 'fireflyapp'],
            ['@Lens', 'Lens'],
            // FW-7952: a 3-char bare handle resolves like any other bare handle
            ['@orb', 'orb'],
            ['@club/handle', undefined],
            ['handle', undefined],
        ] as Array<[string, string | undefined]>;

        cases.forEach(([input, expectedOutput]) => {
            expect(getLensHandleFromMentionTitle(input)).toBe(expectedOutput);
        });
    });
});
