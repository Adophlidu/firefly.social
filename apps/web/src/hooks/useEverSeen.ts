import { type RefObject, useEffect, useRef, useState } from 'react';
import { useIntersection } from 'react-use';

export function useEverSeen<E extends HTMLElement>(
    options: IntersectionObserverInit = {},
): [boolean, RefObject<E | null>] {
    const ref = useRef<E>(null!);
    const [seen, setSeen] = useState(false);
    const nullRef = useRef<E>(null!);
    const entry = useIntersection(seen ? nullRef : ref, options);
    useEffect(() => {
        if (entry?.isIntersecting) setSeen(true);
    }, [entry?.isIntersecting]);

    return [seen, ref];
}
