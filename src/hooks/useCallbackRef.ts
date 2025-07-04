import { useEffect, useRef } from 'react';

export function useCallbackRef<F extends Function>(fn?: F) {
    const ref = useRef(fn);
    useEffect(() => {
        ref.current = fn;
    }, [fn]);
    return ref;
}
