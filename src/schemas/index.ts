import type { Hex } from 'viem';
import { z } from 'zod';

export const Pageable = z.object({
    cursor: z.string().optional(),
    limit: z.coerce
        .number()
        .default(25)
        .refine((value) => {
            if (value) z.coerce.number().int().min(1).parse(value);
            return true;
        }),
});

export const SearchPageable = z.object({
    query: z.string().min(1),
    cursor: z.string().optional(),
    limit: z.coerce
        .number()
        .default(25)
        .refine((value) => {
            if (value) z.coerce.number().int().min(1).parse(value);
            return true;
        }),
});

export const HttpsUrl = z
    .string()
    .url()
    .regex(/^(https:\/\/)/);

export const HexString = z
    .string()
    .regex(/^0x[a-fA-F0-9]+$/)
    .transform((v) => v as Hex);
