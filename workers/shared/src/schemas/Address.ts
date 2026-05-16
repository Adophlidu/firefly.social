import { isAddress } from 'viem';
import z from 'zod';

export const AddressSchema = z.string().transform((val) => {
    if (!isAddress(val)) {
        throw new Error('address must start with 0x');
    }
    return val;
});
