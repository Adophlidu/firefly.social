import type { SubmitTpSl } from '@/types/services';

const delay = async (ms: number) => {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

export const submitTpSl: SubmitTpSl = async ({ tpPrice, slPrice }) => {
    await delay(380);

    return {
        success: true,
        message: tpPrice || slPrice ? 'TP/SL updated' : 'TP/SL confirmed',
    };
};
