import { createContext, useContext } from 'react';

export const DisableScrollRestoreContext = createContext<boolean>(false);

export function useDisableScrollRestore() {
    return useContext(DisableScrollRestoreContext);
}
