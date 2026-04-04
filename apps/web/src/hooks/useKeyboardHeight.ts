import { useEffect, useState } from 'react';

/**
 * This is an advanced behavior only available in some browsers.
 * be careful when using this hook, it may not work as expected in some browsers.
 */
export function useKeyboardHeight() {
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [available, setAvailable] = useState(false);

    useEffect(() => {
        try {
            const handler = (event: { target: { boundingRect: DOMRect } }) => {
                setKeyboardHeight(event.target.boundingRect.height || 0);
            };
            if (navigator && 'virtualKeyboard' in navigator) {
                navigator.virtualKeyboard.overlaysContent = true;
                navigator.virtualKeyboard.addEventListener?.('geometrychange', handler);

                setKeyboardHeight(navigator.virtualKeyboard?.boundingRect?.height || 0);
                setAvailable(true);
            }

            return () => {
                if (navigator && 'virtualKeyboard' in navigator) {
                    navigator.virtualKeyboard.removeEventListener?.('geometrychange', handler);
                }
            };
        } catch (error) {
            setKeyboardHeight(0);
            setAvailable(false);

            return () => {};
        }
    }, []);

    return { keyboardHeight, available };
}
