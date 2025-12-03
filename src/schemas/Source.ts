import { z } from 'zod';

import { SourceInURL } from '@/constants/enum.js';
import { narrowToSocialSourceInURL } from '@/helpers/narrowToSocialSource.js';
import { resolveSocialSource, resolveSource } from '@/helpers/resolveSource.js';

export const SourceSchema = z
    .string()
    .optional()
    .transform((v) => {
        if (!v) return;

        try {
            return resolveSource(v as SourceInURL);
        } catch {
            return;
        }
    });

export const SocialSourceSchema = z
    .string()
    .optional()
    .transform((v) => {
        if (!v) return;

        try {
            const sourceInURL = narrowToSocialSourceInURL(v as SourceInURL);
            return resolveSocialSource(sourceInURL);
        } catch {
            return;
        }
    });
