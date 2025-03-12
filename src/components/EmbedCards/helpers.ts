import type { DetectAddressResponse } from '@/providers/types/Firefly.js';

type AddressRecord = NonNullable<DetectAddressResponse['data']>['list'][number];
export function isAvailableAddress(x: AddressRecord) {
    return !(x.type === 'solana' && x.contract_type === 'program') && x.contract_type !== 'unknown';
}
