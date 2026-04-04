import { useMediaQuery } from 'usehooks-ts';

// Disable initializeWithValue to prevent hydration mismatch (React Error #418).
const MEDIA_QUERY_OPTIONS = { initializeWithValue: false } as const;

export function useIsLarge(constraintType: 'min' | 'max' = 'min') {
    return useMediaQuery(`(${constraintType}-width: 1280px)`, MEDIA_QUERY_OPTIONS);
}

export function useIsMedium(constraintType: 'min' | 'max' = 'min') {
    return useMediaQuery(`(${constraintType}-width: 619px)`, MEDIA_QUERY_OPTIONS);
}

export function useIsSmall(constraintType: 'min' | 'max' = 'min') {
    return useMediaQuery(`(${constraintType}-width: 320px)`, MEDIA_QUERY_OPTIONS);
}
