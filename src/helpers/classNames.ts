/**
 * Combine multiple class names and conditionally include them based on the provided conditions.
 * @param classes - An array or object where keys are class names and values are boolean conditions to include each class.
 * @returns A string containing the combined class names.
 */
export function classNames(...classes: Array<string | null | undefined | Record<string, boolean>>): string {
    const result: string[] = [];

    for (const item of classes) {
        if (!item) continue;
        if (typeof item === 'string') {
            const trimmed = item.trim();
            if (trimmed) result.push(item);
        } else if (typeof item === 'object') {
            for (const [key, value] of Object.entries(item)) {
                if (value) {
                    const trimmed = key.trim();
                    if (trimmed) result.push(trimmed);
                }
            }
        }
    }

    return result.join(' ');
}
