/**
 * remove x_ prefix from post id or profile id
 */
export function formatX3Id(id: string) {
    const idPrefix = 'x_';
    return id.startsWith(idPrefix) ? id.slice(idPrefix.length) : id;
}
