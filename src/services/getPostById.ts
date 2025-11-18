import { type SocialSource, Source } from '@/constants/enum.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { isLensV2PostId } from '@/providers/lens/isLensV2PostId.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';

export async function getPostById(source: SocialSource, postId: string) {
    return runInSafeAsync(() => {
        if (source === Source.Lens && isLensV2PostId(postId)) {
            return LensSocialMediaProvider.getPostById(postId, true);
        }
        const provider = resolveSocialMediaProvider(source);
        return provider.getPostById(postId);
    });
}
