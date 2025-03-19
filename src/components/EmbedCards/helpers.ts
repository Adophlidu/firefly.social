import { parseUrl } from '@/helpers/parseUrl.js';
import type { DetectAddressResponse } from '@/providers/types/Firefly.js';

type AddressRecord = NonNullable<DetectAddressResponse['data']>['list'][number];
export function isAvailableAddress(x: AddressRecord) {
    return !(x.type === 'solana' && x.contract_type === 'program') && x.contract_type !== 'unknown';
}

const hosts = [
    /firefly-mask.*-dimension-dev\.vercel\.app/,
    /(firelfy-staging|firefly-canary|firefly|beta|alpha).mask.social/,
];
export function isFarcasterPost(link: string) {
    const url = parseUrl(link);
    if (!url) return false;
    const match = hosts.some((re) => re.test(url.host));
    if (!match) return false;
    return /^\/post\/farcaster\/0x[a-fA-F0-9]{40}/.test(url.pathname);
}

export function isTakoPost(link: string) {
    const url = parseUrl(link);
    if (!url) return false;
    if (url.host !== 'takocast.xyz' || !/\/cast\/?/.test(url.pathname)) return false;
    const id = url.searchParams.get('id');
    if (!id) return false;
    return /^0x[a-fA-F0-9]{40}/.test(id);
}
