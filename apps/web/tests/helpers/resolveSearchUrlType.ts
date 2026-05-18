import { PredictionPlatform, Source } from '@dimensiondev/enums';
import { describe, expect, test } from 'vitest';

import { SearchType } from '@/constants/enum.js';
import { resolveSearchUrlType, SearchUrlKind } from '@/helpers/resolveSearchUrlType.js';

describe('resolveSearchUrlType', () => {
    test('should resolve twitter profile with trailing slash', () => {
        expect(resolveSearchUrlType('https://x.com/jack/')).toEqual({
            kind: SearchUrlKind.Profile,
            searchType: SearchType.Profiles,
            source: Source.Twitter,
            identifier: 'jack',
        });
    });

    test('should resolve twitter status with query/hash', () => {
        expect(resolveSearchUrlType('https://x.com/alice/status/1234567890?t=abc#view')).toEqual({
            kind: SearchUrlKind.Post,
            searchType: SearchType.Posts,
            source: Source.Twitter,
            identifier: '1234567890',
            secondaryId: 'alice',
        });
    });

    test('should resolve twitter i/web/status url', () => {
        expect(resolveSearchUrlType('https://x.com/i/web/status/9876543210')).toEqual({
            kind: SearchUrlKind.Post,
            searchType: SearchType.Posts,
            source: Source.Twitter,
            identifier: '9876543210',
        });
    });

    test('should resolve farcaster post with trailing slash', () => {
        expect(resolveSearchUrlType('https://farcaster.xyz/dwr/0xabcDEF123/')).toEqual({
            kind: SearchUrlKind.Post,
            searchType: SearchType.Posts,
            source: Source.Farcaster,
            identifier: '0xabcDEF123',
            secondaryId: 'dwr',
        });
    });

    test('should resolve https protocol case-insensitively', () => {
        expect(resolveSearchUrlType('HTTPS://x.com/jack')).toEqual({
            kind: SearchUrlKind.Profile,
            searchType: SearchType.Profiles,
            source: Source.Twitter,
            identifier: 'jack',
        });
    });

    test('should reject non-http protocols', () => {
        expect(resolveSearchUrlType('ftp://x.com/jack')).toBeNull();
    });

    test('should resolve prediction url', () => {
        expect(resolveSearchUrlType('https://polymarket.com/event/us-election')).toEqual({
            kind: SearchUrlKind.Prediction,
            searchType: SearchType.Prediction,
            platform: PredictionPlatform.Polymarket,
            identifier: 'us-election',
        });
    });

    test('should resolve opinion prediction and parse multiple from type', () => {
        expect(resolveSearchUrlType('https://app.opinion.trade/detail?topicId=123&type=multi')).toEqual({
            kind: SearchUrlKind.Prediction,
            searchType: SearchType.Prediction,
            platform: PredictionPlatform.Opinion,
            identifier: '123',
            isMultiple: true,
        });
    });

    test('should resolve opinion prediction and parse multiple from isMulti', () => {
        expect(resolveSearchUrlType('https://app.opinion.trade/detail/?topicId=123&isMulti=1')).toEqual({
            kind: SearchUrlKind.Prediction,
            searchType: SearchType.Prediction,
            platform: PredictionPlatform.Opinion,
            identifier: '123',
            isMultiple: true,
        });
    });
});
