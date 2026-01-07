import type { Hex } from 'viem';
import { z } from 'zod';

export const Pageable = z.object({
    // Twitter API doesn't tolerate empty string
    cursor: z
        .string()
        .optional()
        .transform((v) => v || undefined),
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
    // Twitter API doesn't tolerate empty string
    cursor: z
        .string()
        .optional()
        .transform((v) => v || undefined),
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
