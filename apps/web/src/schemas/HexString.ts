import type { Hex } from 'viem';
import { z } from 'zod';

export const HexString = z
    .string()
    .regex(/^0x[a-fA-F0-9]+$/)
    .transform((v) => v as Hex);
