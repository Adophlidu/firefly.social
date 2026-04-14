const NATIVE_TOKEN_ADDRESSES = new Set(
    [
        '0x0000000000000000000000000000000000000000', // zero address
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // common representation
        '0x0000000000000000000000000000000000001010', // Matic/Polygon native
        '0xd29687c813d741e2f938f4ac377128810e217b1b', // Scroll native
        '0x000000000000000000000000000000000000800a', // Lens native
        '11111111111111111111111111111111', // Solana native
    ].map((address) => address.toLowerCase()),
);

export function isNativeTokenAddress(address: string): boolean {
    if (!address) return true;
    return NATIVE_TOKEN_ADDRESSES.has(address.toLowerCase());
}

export function isNativeTokenOrSameAddress(address1: string, address2: string): boolean {
    if (isNativeTokenAddress(address1) && isNativeTokenAddress(address2)) return true;
    return address1.toLowerCase() === address2.toLowerCase();
}
