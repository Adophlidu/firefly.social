import pino from 'pino';

const pinoLogger = pino({
    level: process.env.LOG_LEVEL || 'info',
});

export class Logger {
    debug(message: string, ...args: unknown[]): void {
        pinoLogger.debug({ args }, message);
    }

    info(message: string, ...args: unknown[]): void {
        pinoLogger.info({ args }, message);
    }

    warn(message: string, ...args: unknown[]): void {
        pinoLogger.warn({ args }, message);
    }

    error(message: string, error?: Error | unknown, ...args: unknown[]): void {
        if (error instanceof Error) {
            pinoLogger.error({ err: error, args }, message);
        } else {
            pinoLogger.error({ error, args }, message);
        }
    }
}

export const logger = new Logger();
