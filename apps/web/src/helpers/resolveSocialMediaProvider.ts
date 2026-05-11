import { attemptUntil, safeUnreachable, UnreachableError } from '@dimensiondev/utils';
import { isServer } from '@tanstack/react-query';

import { type SocialSource, Source } from '@/constants/enum.js';
import { bskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { farcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { lensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import type { OfficialSocialMedia } from '@/providers/twitter/OfficialSocialMedia.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import { nitterSocialMediaProxy, twitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';

interface Options {
    /**
     * Preferred Twitter entry proxy to try first. Both nitter and twitter proxies are still attempted
     * via attemptUntil; this only sets precedence.
     */
    [Source.Twitter]?: 'nitter' | 'twitter';
}

function createTwitterSocialMediaResolverProxy(preferred: 'nitter' | 'twitter'): OfficialSocialMedia {
    const providers =
        preferred === 'nitter'
            ? [nitterSocialMediaProxy, twitterSocialMediaProxy]
            : [twitterSocialMediaProxy, nitterSocialMediaProxy];

    return new Proxy(
        {},
        {
            get(_, prop) {
                if (prop === 'type') return 'proxy';

                return async (...args: unknown[]) => {
                    return attemptUntil(
                        providers.map((target) => () => {
                            const fn = target[prop as keyof OfficialSocialMedia];
                            if (typeof fn !== 'function') return undefined;
                            return (fn as (...a: unknown[]) => Promise<unknown>).apply(target, args);
                        }),
                        undefined,
                        undefined,
                        true,
                    );
                };
            },
        },
    ) as OfficialSocialMedia;
}

/** Check if a cursor looks like a Nitter (v1.1) cursor (has uppercase/base64 chars). */
export function isNitterCursor(cursor: string): boolean {
    return /[A-Z]/.test(cursor);
}

/** Resolve Twitter provider options based on cursor format in pageParam. */
export function resolveProviderOptions(source: SocialSource, pageParam?: string): Options | undefined {
    if (source !== Source.Twitter || !pageParam) return undefined;
    return { [Source.Twitter]: isNitterCursor(pageParam) || isServer ? 'nitter' : 'twitter' };
}

export function resolveSocialMediaProvider(source: SocialSource, options?: Options) {
    switch (source) {
        case Source.Lens:
            return lensSocialMediaProvider;
        case Source.Farcaster:
            return farcasterSocialMediaProvider;
        case Source.Twitter:
            const preferred = options?.[Source.Twitter]
                ? options[Source.Twitter]
                : isServer || !twitterSessionHolder.session
                  ? 'nitter'
                  : 'twitter';

            return createTwitterSocialMediaResolverProxy(preferred);
        case Source.Bsky:
            return bskySocialMediaProvider;
        default:
            safeUnreachable(source);
            throw new UnreachableError('social source', source);
    }
}
