import { useCallback, useImperativeHandle, useRef, useState } from 'react';

import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';

type SingleModalOptions<OpenProps, CloseProps> = {
    onOpen?: (props: OpenProps, dispatch: ReturnType<SingletonModalRefCreator<OpenProps, CloseProps>>) => void;
    onClose?: (props: CloseProps, dispatch: ReturnType<SingletonModalRefCreator<OpenProps, CloseProps>>) => void;
    onAbort?: (error: Error, dispatch: ReturnType<SingletonModalRefCreator<OpenProps, CloseProps>>) => void;
};

export function useSingletonModal<OpenProps, CloseProps>(
    ref: React.ForwardedRef<SingletonModalRefCreator<OpenProps, CloseProps>>,
    options: SingleModalOptions<OpenProps, CloseProps> = {},
) {
    type T = SingletonModalRefCreator<OpenProps, CloseProps>;

    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const dispatchRef = useRef<ReturnType<T>>(null);
    const optionsRef = useRef<typeof options>(null);
    const openRef = useRef(open);
    optionsRef.current = options;
    openRef.current = open;

    const creator: T = useCallback((dispatchOpen, dispatchClose, dispatchAbort) => {
        dispatchRef.current = {
            peek() {
                return openRef.current;
            },
            open(props) {
                optionsRef.current?.onOpen?.(props, this);
                dispatchOpen(props);
                setOpen(true);
                setMounted(true);
            },
            close(props) {
                optionsRef.current?.onClose?.(props, this);
                dispatchClose(props);
                setOpen(false);
            },
            abort(error) {
                optionsRef.current?.onAbort?.(error, this);
                dispatchAbort(error);
                setOpen(false);
            },
        };
        return dispatchRef.current;
    }, []);

    useImperativeHandle(ref, () => creator, [creator]);

    return [open, dispatchRef.current, mounted, optionsRef] as const;
}
