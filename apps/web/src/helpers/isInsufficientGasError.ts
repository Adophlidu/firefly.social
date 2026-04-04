function isInsufficientGasMessage(message: string) {
    if (!message) return false;
    message = message.toLowerCase();
    return ['insufficient lamports'].some((m) => message.includes(m));
}

export function isInsufficientGasError(error: unknown) {
    try {
        const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
        if (isInsufficientGasMessage(message)) {
            return true;
        }

        return false;
    } catch {
        return false;
    }
}
