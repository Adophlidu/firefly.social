import { UserRejectedRequestError } from 'viem';

interface SolanaError {
    code: number;
    message: string;
}

function isRejectedMessage(message: string) {
    return !message
        ? false
        : ['user rejected the request', 'user denied request'].some((m) => message.toLowerCase().includes(m));
}

export function isUserRejectErrorInWallet(error: unknown) {
    try {
        let currentError = error;
        const visited = new Set();

        // For solana wallet adapter
        if (
            error instanceof Error &&
            (isRejectedMessage(error.message) ||
                ('error' in error && isRejectedMessage((error.error as SolanaError)?.message)))
        ) {
            return true;
        }

        // UserRejectedRequestError from viem
        while (currentError instanceof Error && !visited.has(currentError)) {
            visited.add(currentError);
            if (currentError instanceof UserRejectedRequestError) {
                return true;
            }
            currentError = currentError.cause;
        }

        return false;
    } catch {
        return false;
    }
}
