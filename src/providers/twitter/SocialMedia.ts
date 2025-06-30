import { NitterSocialMediaProvider } from '@/providers/twitter/NitterSocialMedia.js';
import { OfficialSocialMedia, OfficialSocialMediaProvider } from '@/providers/twitter/OfficialSocialMedia.js';

function createProxy<T>(providers: Array<Partial<T>>): T {
    return new Proxy(
        {},
        {
            get(_, prop) {
                return async (...args: any[]) => {
                    if (prop === 'type') return 'proxy';

                    for (const provider of providers) {
                        const method = provider[prop as keyof T];
                        if (typeof method === 'function') {
                            return method.call(provider, ...args);
                        }
                    }

                    throw new Error(`Method ${String(prop)} not found on TwitterSocialMediaProxy`);
                };
            },
        },
    ) as T;
}

export const TwitterSocialMediaProxy = createProxy<OfficialSocialMedia>([
    OfficialSocialMediaProvider,
    NitterSocialMediaProvider,
]);

export const NitterSocialMediaProxy = createProxy<OfficialSocialMedia>([
    NitterSocialMediaProvider,
    OfficialSocialMediaProvider,
]);
