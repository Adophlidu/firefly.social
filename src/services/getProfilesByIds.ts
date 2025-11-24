import { SourceInURL } from '@/constants/enum.js';
import { NotImplementedError, UnreachableError } from '@/constants/error.js';
import { farcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { lensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { twitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';

export async function getProfilesByIds(source: SourceInURL, ids: string[]) {
    switch (source) {
        case SourceInURL.Farcaster:
            return farcasterSocialMediaProvider.getProfilesByIds(ids);
        case SourceInURL.Lens:
            return lensSocialMediaProvider.getProfilesByIds(ids);
        case SourceInURL.Twitter:
            return twitterSocialMediaProxy.getProfilesByIds(ids);
        case SourceInURL.Firefly:
        case SourceInURL.Article:
        case SourceInURL.Wallet:
        case SourceInURL.NFTs:
            throw new NotImplementedError(`getProfilesByIds is not implemented for source=${source}`);
        default:
            throw new UnreachableError('Unknown source', source);
    }
}
