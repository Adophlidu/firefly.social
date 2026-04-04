export function isValidPassword(password: string) {
    return /^\d{6}$/.test(password);
}

function isSequentialDigits(password: string) {
    let isSequential = true;
    let isReverseSequential = true;

    for (let i = 1; i < password.length; i += 1) {
        const current = Number.parseInt(password[i], 10);
        const prev = Number.parseInt(password[i - 1], 10);

        // up sequential digits
        if (current !== prev + 1) {
            isSequential = false;
        }

        // down sequential digits
        if (current !== prev - 1) {
            isReverseSequential = false;
        }

        if (!isSequential && !isReverseSequential) {
            break;
        }
    }

    return isSequential || isReverseSequential;
}

export function isStrongDigitPassword(password: string) {
    // All digits are the same
    if (/^(\d)\1{5}$/.test(password)) {
        return false;
    }

    // Contains sequential digits
    if (isSequentialDigits(password)) {
        return false;
    }

    return true;
}
