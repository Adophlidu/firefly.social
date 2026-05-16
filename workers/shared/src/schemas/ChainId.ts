import z from 'zod';

export const ChainIdSchema = z.string().transform((val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
        throw new Error('chainId must be a positive number');
    }
    return num;
});
