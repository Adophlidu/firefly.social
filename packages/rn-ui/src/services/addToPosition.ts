import type { SubmitAddToPosition } from '@/types/services';

const delay = async (ms: number) => {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

export const submitAddToPosition: SubmitAddToPosition = async ({ amount }) => {
    await delay(450);

    if (amount <= 0) {
        return {
            success: false,
            message: 'Invalid amount',
        };
    }

    return {
        success: true,
        message: 'Position updated',
    };
};
