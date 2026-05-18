import { SourceInURL } from '@dimensiondev/enums';
import { describe, expect, test } from 'vitest';

import { CharTag } from '@/constants/enum.js';
import { recoverCharsByMentions } from '@/helpers/recoverCharsByMentions.js';

type Mention = Parameters<typeof recoverCharsByMentions>[1][number];

describe('recoverCharsByMentions', () => {
    test('should return original text if no mentions', () => {
        const text = 'Hello world!';
        const mentions: Mention[] = [];
        expect(recoverCharsByMentions(text, mentions)).toEqual(text);
    });

    test('should recover chars with mentions', () => {
        const text = 'Hello @user1 and @user2!';
        const mentions: Mention[] = [
            {
                text: '@user1',
                platform: [{ uid: '1', platform: SourceInURL.Twitter, handle: 'user1' }],
            },
            {
                text: '@user2',
                platform: [{ uid: '2', platform: SourceInURL.Twitter, handle: 'user2' }],
            },
        ];
        const result = recoverCharsByMentions(text, mentions);
        expect(result).toEqual([
            'Hello ',
            {
                tag: CharTag.MENTION,
                visible: true,
                content: '@user1',
                profiles: [
                    {
                        platform: SourceInURL.Twitter,
                        uid: '1',
                        platform_id: '1',
                        handle: 'user1',
                        name: 'user1',
                        hit: true,
                        score: 1,
                    },
                ],
            },
            ' and ',
            {
                tag: CharTag.MENTION,
                visible: true,
                content: '@user2',
                profiles: [
                    {
                        platform: SourceInURL.Twitter,
                        uid: '2',
                        platform_id: '2',
                        handle: 'user2',
                        name: 'user2',
                        hit: true,
                        score: 1,
                    },
                ],
            },
            '!',
        ]);
    });

    test('should handle overlapping mentions', () => {
        const text = '@user1@user2';
        const mentions: Mention[] = [
            {
                text: '@user1',
                platform: [{ uid: '1', platform: SourceInURL.Twitter, handle: 'user1' }],
            },
            {
                text: '@user1@user2',
                platform: [{ uid: '2', platform: SourceInURL.Twitter, handle: 'user1_user2' }],
            },
        ];
        const result = recoverCharsByMentions(text, mentions);
        expect(result).toEqual([
            {
                tag: CharTag.MENTION,
                visible: true,
                content: '@user1@user2',
                profiles: [
                    {
                        platform: SourceInURL.Twitter,
                        uid: '2',
                        platform_id: '2',
                        handle: 'user1_user2',
                        name: 'user1_user2',
                        hit: true,
                        score: 1,
                    },
                ],
            },
        ]);
    });

    test('should return original text if mentions do not match', () => {
        const text = 'Hello world!';
        const mentions: Mention[] = [
            {
                text: '@user1',
                platform: [{ uid: '1', platform: SourceInURL.Twitter, handle: 'user1' }],
            },
        ];
        expect(recoverCharsByMentions(text, mentions)).toEqual(text);
    });

    test('should handle multiple occurrences of the same mention', () => {
        const text = '@user1 says hello to @user1';
        const mentions: Mention[] = [
            {
                text: '@user1',
                platform: [{ uid: '1', platform: SourceInURL.Twitter, handle: 'user1' }],
            },
        ];
        const result = recoverCharsByMentions(text, mentions);
        expect(result).toEqual([
            {
                tag: CharTag.MENTION,
                visible: true,
                content: '@user1',
                profiles: [
                    {
                        platform: SourceInURL.Twitter,
                        uid: '1',
                        platform_id: '1',
                        handle: 'user1',
                        name: 'user1',
                        hit: true,
                        score: 1,
                    },
                ],
            },
            ' says hello to ',
            {
                tag: CharTag.MENTION,
                visible: true,
                content: '@user1',
                profiles: [
                    {
                        platform: SourceInURL.Twitter,
                        uid: '1',
                        platform_id: '1',
                        handle: 'user1',
                        name: 'user1',
                        hit: true,
                        score: 1,
                    },
                ],
            },
        ]);
    });

    test('should return original text if text is empty', () => {
        const text = '';
        const mentions: Mention[] = [
            {
                text: '@user1',
                platform: [{ uid: '1', platform: SourceInURL.Twitter, handle: 'user1' }],
            },
        ];
        expect(recoverCharsByMentions(text, mentions)).toEqual(text);
    });
});
