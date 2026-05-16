export function trimify(value: string) {
    return value.replace(/\n/gi, '&nbsp; \n').trim();
}
