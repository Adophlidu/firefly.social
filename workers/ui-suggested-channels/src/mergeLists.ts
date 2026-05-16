export function mergeLists<T>(...lists: T[][]) {
    const result: T[] = [];
    const maxLength = Math.max(...lists.map((list) => list.length));

    for (let i = 0; i < maxLength; i += 1) {
        for (const list of lists) {
            if (i < list.length) result.push(list[i]);
        }
    }

    return result;
}
