import { createContext, useContext } from 'react';

interface ComposeModalContextValue {
    onClose: () => void | Promise<unknown>;
}

export const ComposeModalContext = createContext<ComposeModalContextValue>({
    onClose: () => {},
});

// Why we need this context:
// TanStack Router optimizes context updates and might not trigger re-renders when
// function references in the context change (like onClose with updated closure variables).
// Using a standard React Context ensures that consumers always get the latest
// callback reference with the correct closure state (e.g. updated posts data).
export function useComposeModalContext() {
    return useContext(ComposeModalContext);
}
