import { SourceInURL } from '@/constants/enum.js';
import { NotImplementedError, UnreachableError } from '@/constants/error.js';
import { FarcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { TwitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';

export async function getProfilesByIds(source: SourceInURL, ids: string[]) {
    switch (source) {
        case SourceInURL.Farcaster:
            return FarcasterSocialMediaProvider.getProfilesByIds(ids);
        case SourceInURL.Lens:
            return LensSocialMediaProvider.getProfilesByIds(ids);
        case SourceInURL.Twitter:
            return TwitterSocialMediaProxy.getProfilesByIds(ids);
        case SourceInURL.Firefly:
        case SourceInURL.Article:
        case SourceInURL.Wallet:
        case SourceInURL.NFTs:
            throw new NotImplementedError(`getProfilesByIds is not implemented for source=${source}`);
        default:
            throw new UnreachableError('Unknown source', source);
    }
}
