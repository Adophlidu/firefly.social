import { type SocialSource, Source } from '@/constants/enum.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { isLensV2PostId } from '@/providers/lens/isLensV2PostId.js';
import { lensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';

export async function getPostById(source: SocialSource, postId: string) {
    if (source === Source.Lens && isLensV2PostId(postId)) {
        return lensSocialMediaProvider.getPostById(postId, true);
    }
    const provider = resolveSocialMediaProvider(source);
    return provider.getPostById(postId);
}
