import { getEnumAsArray } from '@/shared/src/helpers/getEnumAsArray.js';

/**
 * Validate if a value is a valid enum value
 * @param value
 * @param enumObj
 * @returns
 */
export function isValidEnumValue<T extends object>(value: string | number, enumObj: T) {
    return getEnumAsArray(enumObj).some(({ value: enumValue }) => value === enumValue);
}
