export function removeCombiningCharacters(str: string) {
    try {
        return str.normalize('NFD').replace(/\p{M}/gu, '');
    } catch {
        return str;
    }
}
