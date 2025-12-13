import { IS_PRODUCTION } from '@/constants/static.js';

export class Logger {
    debug(message: string, ...args: unknown[]): void {
        if (!IS_PRODUCTION) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }

    info(message: string, ...args: unknown[]): void {
        console.info(`[INFO] ${message}`, ...args);
    }

    warn(message: string, ...args: unknown[]): void {
        console.warn(`[WARN] ${message}`, ...args);
    }

    error(message: string, error?: Error | unknown, ...args: unknown[]): void {
        if (error instanceof Error) {
            console.error(`[ERROR] ${message}`, error, ...args);
        } else {
            console.error(`[ERROR] ${message}`, error, ...args);
        }
    }
}

export const logger = new Logger();
