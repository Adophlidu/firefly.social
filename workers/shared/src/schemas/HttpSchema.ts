import z from 'zod';

export const HttpUrl = z
    .string()
    .url()
    .regex(/^(https?:\/\/)/);

export const HttpsUrl = z
    .string()
    .url()
    .regex(/^(https:\/\/)/);
