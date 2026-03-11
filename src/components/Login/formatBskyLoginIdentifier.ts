import { DEFAULT_SERVICE_URL } from '@/constants/bsky.js';

function createBskyFullHandle(name: string, domain: string): string {
    const parsedName = (name || '').replace(/[.]+$/, '');
    const parsedDomain = (domain || '').replace(/^[.]+/, '');

    return `${parsedName}.${parsedDomain}`;
}

export function formatBskyLoginIdentifier(
    username: string,
    serviceUrl: string,
    serviceDescription?: {
        availableUserDomains: string[];
    },
) {
    if (username.includes('@') || username.includes('.')) return username;

    if (serviceUrl === DEFAULT_SERVICE_URL) {
        return createBskyFullHandle(username, '.bsky.social');
    }

    if (serviceDescription && serviceDescription.availableUserDomains.length > 0) {
        const matched = serviceDescription.availableUserDomains.some((x) => username.endsWith(x));
        if (!matched) {
            username = createBskyFullHandle(username, serviceDescription.availableUserDomains[0]);
        }
    }

    return username;
}
