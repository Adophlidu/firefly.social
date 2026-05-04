export function removeTrailingZeros(str: string) {
    const result = str.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return result === '0' ? '0' : result;
}
