import z from 'zod';

export const Pathname = z.string().startsWith('/', 'Pathname must start with /');
