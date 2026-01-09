import { type Response } from '@/providers/x3pro/types.js';

export function resolveX3ProResponse<T>(res: Response<T>) {
    if (res.success) return res.data;
    throw new Error(res.error.message);
}
