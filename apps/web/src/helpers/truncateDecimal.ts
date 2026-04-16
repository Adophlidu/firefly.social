export function truncateDecimal(value: string | number, precision = 2, threshold = 0.01): string {
    if (precision < 0) return value.toString();
    if (value === null || value === undefined || value === '') return '0';

    const strValue = String(value).trim();
    if (!/^-?\d*\.?\d*$/.test(strValue)) return strValue;

    const numValue = Number.parseFloat(strValue);
    if (Math.abs(numValue) < threshold && Math.abs(numValue) > 0) return `< ${threshold}`;
    if (numValue === 0) return precision === 0 ? '0' : `0.${'0'.repeat(precision)}`;
    if (!strValue.includes('.')) return strValue;

    const [integerPart, decimalPart] = strValue.split('.');
    if (decimalPart.length > 0 && decimalPart.length <= precision) {
        if (parseInt(decimalPart, 10) === 0 && precision === 0) {
            return integerPart;
        }
        return `${integerPart}.${decimalPart}`;
    }
    if (parseInt(decimalPart, 10) === 0 && precision === 0) return integerPart;

    const truncatedDecimal = decimalPart.substring(0, precision);
    if (precision === 0) return integerPart;
    if (parseInt(truncatedDecimal, 10) === 0) return integerPart;

    return `${integerPart}.${truncatedDecimal}`;
}
