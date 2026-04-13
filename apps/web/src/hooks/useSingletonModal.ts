import { type ForwardedRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { EVENT_MODAL } from '@/constants/event.js';
import type { ModalEvents } from '@/helpers/dispatchModalEvent.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';

interface SingleModalOptions<OpenProps, CloseProps> {
    /**
     * Optional modal name for document event support.
     * If provided, the modal will listen to document events for open/close/abort actions.
     */
    name?: keyof ModalEvents;

    onOpen?: (props: OpenProps, dispatch: ReturnType<SingletonModalRefCreator<OpenProps, CloseProps>>) => void;
    onClose?: (props: CloseProps, dispatch: ReturnType<SingletonModalRefCreator<OpenProps, CloseProps>>) => void;
    onAbort?: (error: Error, dispatch: ReturnType<SingletonModalRefCreator<OpenProps, CloseProps>>) => void;
}

export function useSingletonModal<OpenProps, CloseProps>(
    ref: ForwardedRef<SingletonModalRefCreator<OpenProps, CloseProps>>,
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

    // Listen to document events for open/close/abort actions
    const { name } = options;
    useEffect(() => {
        if (!name || !dispatchRef.current) return;

        const handleModalEvent = (event: Event) => {
            const { detail } = event as CustomEvent<{
                name: string;
                action: 'open' | 'close' | 'abort';
                props?: OpenProps | CloseProps;
                error?: Error;
            }>;

            if (detail.name !== name || !dispatchRef.current) return;

            const { action, props, error } = detail;
            if (action === 'open' && props !== undefined) {
                dispatchRef.current.open(props as OpenProps);
            } else if (action === 'close') {
                dispatchRef.current.close((props ?? undefined) as CloseProps);
            } else if (action === 'abort' && error) {
                dispatchRef.current.abort?.(error);
            }
        };

        const eventName = `${EVENT_MODAL}:${name}`;
        document.addEventListener(eventName, handleModalEvent);
        return () => document.removeEventListener(eventName, handleModalEvent);
    }, [name]);

    return [open, dispatchRef.current, mounted, optionsRef] as const;
}
