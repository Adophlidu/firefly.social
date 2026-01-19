import { type SocialSource, Source } from '@/constants/enum.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { getLensPostById } from '@/providers/lens/getLensPostById.js';
import { isLensV2PostId } from '@/providers/lens/isLensV2PostId.js';

export async function getPostById(source: SocialSource, postId: string) {
    if (source === Source.Lens && isLensV2PostId(postId)) {
        return getLensPostById(postId, true);
    }
    const provider = resolveSocialMediaProvider(source);
    return provider.getPostById(postId);
}
