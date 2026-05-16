import { parseParagraphHtml } from '@/metadata/src/article/parseParagraphHtml.js';
import type { Article } from '@/metadata/src/article/types.js';
import { ArticlePlatform } from '@/metadata/src/article/types.js';

async function getArticleContent(article: Article) {
    if (
        article.platform === ArticlePlatform.Paragraph &&
        article.paragraph_raw_data?.staticHtml &&
        article.paragraph_raw_data.json
    ) {
        const parsedContent = await parseParagraphHtml(
            article.paragraph_raw_data.staticHtml,
            article.paragraph_raw_data.json,
        );
        return parsedContent ?? article.paragraph_raw_data.staticHtml;
    }
    return article.content.body;
}

export async function getArticleDescription(article: Article) {
    const content = await getArticleContent(article);

    // Simple regex-based approach to extract text content
    const textContent = content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

    return textContent;
}
