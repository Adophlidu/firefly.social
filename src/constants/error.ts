import { parseJson } from '@dimensiondev/utils';

import { type ProfileSource, type SocialSource } from '@/constants/enum.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { logger } from '@/libs/Logger.js';

export class DecryptionError extends Error {
    override name = 'DecryptionFailed';

    constructor(message?: string) {
        super(message ?? 'Decryption failed');
    }
}

export class MalformedRequestError extends Error {
    override name = 'MalformedRequestError';

    constructor(message?: string) {
        super(message ?? 'Malformed request');
    }
}

export class FetchError extends Error {
    override name = 'FetchError';

    constructor(
        message: string,
        public url: string,
        public status: number,
        public statusText: string,
        public text: string,
    ) {
        super(message);
    }

    toThrow(): never {
        // exception tracker may truncate the message if it's too long
        logger.error(
            `[fetch error]: ${this.url} ${this.status} ${this.statusText} ${[this.message, this.text].join('\n')}`,
        );
        throw this;
    }

    static from(input: RequestInfo | URL | string, response: Response, text: string, message?: string) {
        const method = typeof input === 'string' ? 'GET' : input instanceof URL ? 'GET' : input.method.toUpperCase();

        return new FetchError(
            message ??
                [
                    `[fetch] failed to fetch: ${method} ${response.status} ${response.statusText} ${response.url}`,
                    text,
                ].join('\n'),
            response.url,
            response.status,
            response.statusText,
            text,
        );
    }

    get errorMessage() {
        const parsed = parseJson<{ error?: string[] | string }>(this.text);
        if (parsed?.error) return Array.isArray(parsed.error) ? parsed.error.join(', ') : parsed.error;
        return;
    }
}

export class FarcasterPatchSignerError extends Error {
    override name = 'FarcasterPatchSignerError';

    constructor(public fid: number) {
        super(`Failed to patch signer key to Farcaster session: ${fid}`);
    }
}

export class FarcasterInvalidSignerKey extends Error {
    override name = 'FarcasterInvalidSignerKey';

    constructor(message?: string) {
        super(message ?? 'Invalid Farcaster signer key.');
    }
}

export class FireflyAccountAbsentError extends Error {
    override name = 'FireflyAccountAbsentError';
    constructor(public source: ProfileSource) {
        super(`This ${source} account does not exists.`);
    }
}

export class FireflyAlreadyBoundError extends Error {
    override name = 'FireflyAlreadyBoundError';

    constructor(public source: ProfileSource) {
        super(`This ${source} account has already bound to another Firefly account.`);
    }
}

export class FireflyBindTimeoutError extends Error {
    override name = 'FireflyBindTimeoutError';
    constructor(public source: ProfileSource) {
        super(`Bind ${source} account to Firefly timeout.`);
    }
}

export class FireflyFidNotRegisteredError extends Error {
    override name = 'FireflyFidNotRegisteredError';

    constructor(message?: string) {
        super(message ?? 'Your account has not registered this fid on Firefly');
    }
}

export class InvalidOrbPermissionError extends Error {
    override name = 'InvalidOrbPermissionError';

    constructor() {
        super('Invalid Orb permission.');
    }
}

export class RPC_Error extends Error {
    override name = 'RPC_Error';

    constructor(message?: string) {
        super(message ?? 'RPC Error.');
    }
}

export class SwitchChainError extends Error {
    override name = 'SwitchChainError';

    constructor(chainName?: string) {
        super(
            chainName
                ? `Please switch to the ${chainName} network in your wallet.`
                : `Please switch to the correct network in your wallet.`,
        );
    }
}

export class ChainConfigMismatchError extends Error {
    override name = 'ChainConfigMismatchError';

    constructor(message?: string) {
        super(message ?? 'Chain config mismatch.');
    }
}

export class CreateScheduleError extends Error {
    override name = 'CreateScheduleError';

    constructor(
        public override message: string,
        public description?: string,
    ) {
        super(message);
    }
}

export class OTPExceededMaximumLimit extends Error {
    override name = 'OTPExceededMaximumLimit';

    constructor(message?: string) {
        super(message ?? 'OTP exceeded maximum limit.');
    }
}

export class LoginEmailError extends Error {
    override name = 'LoginEmailError';

    constructor(message?: string) {
        super(message ?? 'The code you have entered is incorrect, please try again.');
    }
}

export class InvalidAddressError extends Error {
    override name = 'InvalidAddressError';

    constructor(address: string, message?: string) {
        super(message ?? `Invalid EVM address: ${address}.`);
    }
}

export class AccountSuspendedError extends Error {
    override name = 'AccountSuspendedError';

    constructor(handle: string, source: ProfileSource, message?: string) {
        super(message ?? `Account suspended with handle=${handle}, source=${source}.`);
    }
}

export class WalletAddressMismatchError extends Error {
    override name = 'WalletAddressMismatchError';

    constructor(message?: string) {
        super(message ?? 'Wallet address mismatch.');
    }
}

export class WalletNotConnectedError extends Error {
    override name = 'WalletNotConnectedError';
}

/**
 * Error thrown when a Bluesky XRPC endpoint is not supported (404).
 * This is expected when using custom PDS instances that don't support all endpoints.
 * Should be handled gracefully without logging to error tracking.
 */
export class XRPCNotSupportedError extends Error {
    override name = 'XRPCNotSupportedError';

    constructor(message?: string) {
        super(message ?? 'XRPC not supported.');
    }

    static is(error: unknown) {
        if (!error || typeof error !== 'object') return false;

        const err = error as Record<string, unknown>;

        // Check if it's an XRPCNotSupported error
        const isXRPCNotSupported =
            err.error === 'XRPCNotSupported' ||
            err.message === 'XRPCNotSupported' ||
            (typeof err.message === 'string' && err.message.includes('XRPCNotSupported'));

        // Check if status is 404
        const is404 = err.status === 404;

        return isXRPCNotSupported && is404;
    }
}

export class NftScanError extends Error {
    override name = 'NftScanError';

    constructor(message?: string) {
        super(message ?? 'NftScan error.');
    }
}

export class SessionExpiredError extends Error {
    override name = 'SessionExpiredError';

    constructor(
        public source: SocialSource,
        message?: string,
    ) {
        super(message ?? `${resolveSourceName(source)} session has been expired.`);
    }
}

export class NitterError extends Error {
    override name = 'NitterError';

    constructor(url: string, message?: string) {
        super(`[NitterError] ${url} ${message || 'Unknown nitter error.'}`);
    }
}

export class TweetUnavailableError extends Error {
    override name = 'TweetUnavailableError';
}
