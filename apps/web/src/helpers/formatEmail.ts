import { EMAIL_REGEX } from '@/constants/regexp.js';

export function formatEmail(email: string): string {
    if (!EMAIL_REGEX.test(email)) return email;

    const [localPart, domain] = email.split('@');

    const prefix = localPart!.slice(0, Math.min(2, localPart!.length));
    const masked = `${prefix}*****`;

    return `${masked}@${domain}`;
}
