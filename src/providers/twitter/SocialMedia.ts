import { NotImplementedError } from '@/constants/error.js';
import { nitterSocialMediaProvider } from '@/providers/twitter/NitterSocialMedia.js';
import { OfficialSocialMedia, officialSocialMediaProvider } from '@/providers/twitter/OfficialSocialMedia.js';

function createProxy<T>(providers: Array<Partial<T>>): T {
    return new Proxy(
        {},
        {
            get(_, prop) {
                return async (...args: any[]) => {
                    if (prop === 'type') return 'proxy';

                    let latestError: unknown | null = null;

                    for (const provider of providers) {
                        const method = provider[prop as keyof T];
                        try {
                            if (typeof method === 'function') {
                                return method.call(provider, ...args);
                            }
                        } catch (error) {
                            latestError = error;

                            if (error instanceof NotImplementedError) {
                                continue; // Skip to the next provider if NotImplementedError is thrown
                            }
                        }
                    }

                    throw latestError || new Error(`Method ${String(prop)} not found on TwitterSocialMediaProxy`);
                };
            },
        },
    ) as T;
}

export const twitterSocialMediaProxy = createProxy<OfficialSocialMedia>([
    officialSocialMediaProvider,
    nitterSocialMediaProvider,
]);

export const nitterSocialMediaProxy = createProxy<OfficialSocialMedia>([
    nitterSocialMediaProvider,
    officialSocialMediaProvider,
]);
