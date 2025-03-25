import { Source } from '@/constants/enum.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { OpenGraphProcessor } from '@/providers/og/Processor.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import { extractTwitterProfileByOpengraphTitle, getTwitterProfileByOG } from '@/services/getTwitterProfileByOG.js';

export async function getTwitterPostByOG(postId: string): Promise<Post | null> {
    const timeout = AbortSignal.timeout(60_000);
    const ogResult = await runInSafeAsync(() =>
        OpenGraphProcessor.digestDocumentUrl(`https://x.com/realMaskNetwork/status/${postId}`, timeout),
    );
    if (!ogResult?.og) return null;
    const { handle } = extractTwitterProfileByOpengraphTitle(ogResult.og.title ?? '');
    const author = await getTwitterProfileByOG(handle);
    if (!author) return null;
    return {
        postId,
        source: Source.Twitter,
        publicationId: postId,
        metadata: {
            content: {
                content: ogResult.og.description ?? '',
                asset: ogResult.og.image?.url
                    ? {
                          type: 'Image',
                          uri: ogResult.og.image?.url,
                          width: ogResult.og.image?.width,
                          height: ogResult.og.image?.height,
                      }
                    : undefined,
            },
            locale: 'en',
        },
        author,
    } satisfies Post;
}
