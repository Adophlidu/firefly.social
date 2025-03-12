import bs58 from 'bs58';

export function isValidSolanaAddress(address?: string): address is string {
    const length = address?.length;
    if (!length || length < 32 || length > 44) return false;
    try {
        const buffer = bs58.decode(address);
        return buffer.byteLength === 32;
    } catch {
        return false;
    }
}
