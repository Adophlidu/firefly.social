export function trimify(value: string) {
    return value.replace(/\n/gi, '&nbsp; \n').trim();
}

export function trimifyPost(value: string) {
    return value.replace(/\n\n\s*\n/g, '\n\n').trim();
}
