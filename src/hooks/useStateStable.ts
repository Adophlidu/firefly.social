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

    useEffect(() => {
        // Only update once when the value changes
        if (value !== previousValue.current && !hasUpdated.current) {
            setStableValue(value);
            hasUpdated.current = true;
        }

        // Update the previous value reference
        previousValue.current = value;
    }, [value]);

    return [stableValue, setStableValue] as const;
}
