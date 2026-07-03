import { ArticlePlatform } from '@dimensiondev/enums';
import { describe, expect, it } from 'vitest';

import { getArticleHtmlContent } from '@/helpers/getArticleHtmlContent.js';

describe('getArticleHtmlContent', () => {
    it('prefers htmlContent for Matters articles', () => {
        expect(
            getArticleHtmlContent({
                platform: ArticlePlatform.Matters,
                content: 'summary',
                htmlContent: '<p>full html</p>',
            }),
        ).toBe('<p>full html</p>');
    });

    it('falls back to content for Matters articles without htmlContent', () => {
        expect(
            getArticleHtmlContent({
                platform: ArticlePlatform.Matters,
                content: 'summary',
            }),
        ).toBe('summary');
    });

    it('returns content for non-Matters articles', () => {
        expect(
            getArticleHtmlContent({
                platform: ArticlePlatform.Paragraph,
                content: '<p>paragraph</p>',
                htmlContent: '<p>ignored</p>',
            }),
        ).toBe('<p>paragraph</p>');
    });
});
