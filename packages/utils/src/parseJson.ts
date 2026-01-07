export function parseJson<T>(json: string | undefined | null) {
    if (!json) return;

    try {
        return JSON.parse(json) as T;
    } catch {
        return;
    }
}
