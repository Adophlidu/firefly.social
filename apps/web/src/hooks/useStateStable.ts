import { useEffect, useRef, useState } from 'react';

/**
 * A hook that tracks a given value and returns the same value.
 * If the value changes, the returned value updates only once.
 * Subsequent changes to the input value will not update the returned value.
 */
export function useStateStable<T>(value: T) {
    const [stableValue, setStableValue] = useState<T>(value);
    const hasUpdated = useRef<boolean>(false);
    const previousValue = useRef<T>(value);
    const isInitialMount = useRef<boolean>(true);

    useEffect(() => {
        // On initial mount, sync if value differs from initial state (e.g. from async data)
        if (isInitialMount.current) {
            isInitialMount.current = false;
            if (value !== stableValue) {
                setStableValue(value);
                hasUpdated.current = true;
            }
            previousValue.current = value;
            return;
        }

        // Only update once when the value changes after initial mount
        if (value !== previousValue.current && !hasUpdated.current) {
            setStableValue(value);
            hasUpdated.current = true;
        }

        previousValue.current = value;
    }, [value]);

    return [stableValue, setStableValue] as const;
}
