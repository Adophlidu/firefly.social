import { type CSSProperties, useMemo } from 'react';

export function useSizeStyle(size?: number, props?: CSSProperties) {
    return useMemo<CSSProperties>(() => {
        return {
            width: size,
            height: size,
            ...props,
        };
    }, [size, props]);
}
