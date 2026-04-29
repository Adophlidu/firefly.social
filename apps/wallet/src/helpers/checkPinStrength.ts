import { t } from '@lingui/core/macro';
import type { ReactNode } from 'react';

export interface PinStrengthResult {
    isValid: boolean;
    score: number;
    message: ReactNode;
}

export const checkPinStrength = (pin: string): PinStrengthResult => {
    if (!/^\d{6}$/.test(pin)) {
        return { isValid: false, score: 0, message: t`Must be a 6-digit number.` };
    }

    // 2. 111111, 000000
    if (/^(\d)\1{5}$/.test(pin)) {
        return { isValid: false, score: 0, message: t`PIN is too weak. Avoid repeated digits.` };
    }

    // 3. 123456, 654321, 012345
    const isAscending = '0123456789'.includes(pin);
    const isDescending = '9876543210'.includes(pin);
    if (isAscending || isDescending) {
        return {
            isValid: false,
            score: 0,
            message: t`PIN is too weak. Avoid sequential digits.`,
        };
    }

    const uniqueDigitsCount = new Set(pin.split('')).size;

    if (uniqueDigitsCount <= 3) {
        return {
            isValid: true,
            score: 2,
            message: t`PIN is acceptable, but consider adding more unique digits.`,
        };
    }

    return { isValid: true, score: 3, message: t`PIN is extremely strong.` };
};
