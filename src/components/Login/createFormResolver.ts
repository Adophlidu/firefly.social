import { z } from 'zod';

import { HttpsUrl } from '@/schemas/HttpsUrl.js';

export const loginBskySchema = z.object({
    account: z.string().min(1),
    password: z.string().min(1),
    serviceUrl: z.union([HttpsUrl, z.literal('')]).optional(),
    authFactorToken: z.string().optional().or(z.literal('')),
});

export function createLoginBskyFormResolver() {
    return (values: z.input<typeof loginBskySchema>) => {
        const result = loginBskySchema.safeParse(values);

        if (result.success) {
            return {
                values: result.data,
                errors: {},
            };
        }

        const errors: Record<string, { type: string; message: string }> = {};
        result.error.issues.forEach((issue) => {
            const path = issue.path.join('.');
            errors[path] = {
                type: 'validation',
                message: issue.message,
            };
        });

        return {
            values: {},
            errors,
        };
    };
}
