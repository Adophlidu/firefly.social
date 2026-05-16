/**
 * Creates an array with all falsy values removed.
 * The values false, null, 0, "", undefined, and NaN are falsy.
 *
 * @param array - The array to compact
 * @returns Returns the new array of filtered values
 *
 * @example
 * ```typescript
 * compact([0, 1, false, 2, '', 3, null, undefined, NaN])
 * // => [1, 2, 3]
 * ```
 */
export function compact<T>(array?: Array<T | undefined | null>): Array<NonNullable<T>> {
    if (!array) return [];
    return array.filter((value) => {
        // Remove all falsy values: false, null, 0, "", undefined, NaN
        return (
            value !== false &&
            value !== null &&
            value !== 0 &&
            value !== '' &&
            value !== undefined &&
            !Number.isNaN(value)
        );
    }) as Array<NonNullable<T>>;
}
