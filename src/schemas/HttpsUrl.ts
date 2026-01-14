import { z } from 'zod';

export const HttpsUrl = z
    .string()
    .url()
    .regex(/^(https:\/\/)/);
