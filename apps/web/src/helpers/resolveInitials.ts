export function resolveInitials(name: string): string {
    return name
        .split(/\s+/u)
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
}
