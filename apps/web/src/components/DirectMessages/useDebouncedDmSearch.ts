import { useDebounceValue } from 'usehooks-ts';

const DM_SEARCH_DEBOUNCE_MS = 300;

export function useDebouncedDmSearch(value: string) {
    const [debouncedValue] = useDebounceValue(value, DM_SEARCH_DEBOUNCE_MS);
    return debouncedValue;
}
