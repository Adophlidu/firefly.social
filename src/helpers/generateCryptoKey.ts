export function generateCryptoKey() {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const number = array[0] % 1000000;
    return number.toString().padStart(6, '0');
}
