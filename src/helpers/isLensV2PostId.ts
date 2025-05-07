import { isHex } from 'viem';

export function isLensV2PostId(id: string) {
    if (!id?.startsWith('0x')) return false;

    const [head, tail, ...rest] = id.split('-');

    return isHex(head) && isHex(tail) && rest.length === 0;
}
