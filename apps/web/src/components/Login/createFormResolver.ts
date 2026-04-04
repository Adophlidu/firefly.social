import { parseUrl } from '@dimensiondev/utils';
import { z } from 'zod';

export const loginBskySchema = z.object({
    account: z.string().min(1),
    password: z.string().min(1),
    serviceUrl: z.custom<string>(
        (val) => {
            if (!val) return true; // Allow empty string for default service URL

            const u = parseUrl(val);
            return u?.protocol === 'https:';
        },
        { message: 'Service URL must be a valid HTTPS URL or empty for default' },
    ),
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
