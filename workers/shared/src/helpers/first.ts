export function first<T>(array: T[] | undefined): T | undefined {
    if (Array.isArray(array) && array.length > 0) return array[0];
    return;
}
