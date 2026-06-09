const PREFIX = '[firefly-auth]';

export interface Logger {
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
}

/** Create a console logger whose `info` channel is gated behind `debug`. */
export function createLogger(debug: boolean): Logger {
    return {
        info(...args: unknown[]): void {
            if (debug) console.info(PREFIX, ...args);
        },
        warn(...args: unknown[]): void {
            console.warn(PREFIX, ...args);
        },
        error(...args: unknown[]): void {
            console.error(PREFIX, ...args);
        },
    };
}
