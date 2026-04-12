import { useMutation } from '@tanstack/react-query';

import type { SnackbarMessage } from '@/components/Snackbar.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';

export interface UseToggleBookmarkMutationOptions<T> {
    isLoggedIn: boolean;
    openLogin?: () => void;
    getHasBookmarked: (item: T) => boolean;
    mutationFn: (item: T) => Promise<unknown>;
    successMessages: { add: SnackbarMessage; remove: SnackbarMessage };
    errorMessages: { add: SnackbarMessage; remove: SnackbarMessage };
}

export function useToggleBookmarkMutation<T>({
    isLoggedIn,
    openLogin = openLoginModal,
    getHasBookmarked,
    mutationFn,
    successMessages,
    errorMessages,
}: UseToggleBookmarkMutationOptions<T>) {
    return useMutation({
        mutationFn: async (item: T) => {
            if (!isLoggedIn) {
                openLogin();
                return;
            }

            const hasBookmarked = getHasBookmarked(item);
            try {
                const result = await mutationFn(item);
                enqueueSuccessMessage(hasBookmarked ? successMessages.remove : successMessages.add);
                return result;
            } catch (error) {
                enqueueMessageFromError(error, hasBookmarked ? errorMessages.remove : errorMessages.add);
                throw error;
            }
        },
    });
}
