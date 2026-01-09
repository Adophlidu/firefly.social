/**
 * Returns the specified number as a string with commas added to separate groups of three digits.
 *
 * @param number The number to humanize.
 * @returns The humanized number as a string.
 */
export const humanize = (number: number): string => {
    if (typeof number !== 'number' || isNaN(number)) {
        return '';
    }

    return number.toLocaleString();
};

/**
 * Formats a number by abbreviating it using SI unit prefixes.
 *
 * @param num The number to format.
 * @param digits The number of digits to show after the decimal point. Default is 1.
 * @param useFloor If true, uses Math.floor for rounding down; otherwise uses toFixed for rounding. Default is false.
 * @returns The formatted number as a string with the appropriate prefix.
 */
export const nFormatter = (num: number, digits = 1, useFloor = false): string => {
    const lookup = [
        { value: 1, symbol: '' },
        { value: 1e3, symbol: 'k' },
        { value: 1e6, symbol: 'M' },
        { value: 1e9, symbol: 'B' },
        { value: 1e12, symbol: 'T' },
        { value: 1e15, symbol: 'P' },
        { value: 1e18, symbol: 'E' },
    ];

    const rx = /\.0+$|(\.\d*[1-9])0+$/;

    const formatToDigits = (value: number, decimalPlaces: number): string => {
        const factor = Math.pow(10, decimalPlaces);
        const floored = useFloor ? Math.floor(value * factor) / factor : value;
        return floored.toFixed(decimalPlaces).replace(rx, '$1');
    };

    if (num < 1 && num > 0) {
        return formatToDigits(num, digits);
    }

    const item = [...lookup].reverse().find(function (item) {
        return num >= item.value;
    });

    // Format the number with the appropriate SI prefix and number of digits
    return item ? (num < 1000 ? humanize(num) : formatToDigits(num / item.value, digits) + item.symbol) : '0';
};
