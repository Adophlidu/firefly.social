export function isUnlimit(amount: string) {
    return (
        BigInt(amount.replace('.', '')) ===
        115792089237316195423570985008687907853269984665640564039457584007913129639935n
    );
}
