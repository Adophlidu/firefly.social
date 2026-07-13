// src/shims/pino.ts
const noop = (...args: unknown[]) => {
    console.warn('Pino logger is not available in this environment. Please install pino to enable logging.', ...args);
};

const levelValues = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60,
    silent: Infinity,
} as const;

const levelLabels = Object.fromEntries(Object.entries(levelValues).map(([k, v]) => [v, k])) as Record<number, string>;

export const levels = {
    values: levelValues,
    labels: levelLabels,
};

export const symbols = {
    levelSym: Symbol('level'),
    serializersSym: Symbol('serializers'),
    mixinSym: Symbol('mixin'),
    mixinMergeStrategySym: Symbol('mixinMergeStrategy'),
    formattersSym: Symbol('formatters'),
    hooksSym: Symbol('hooks'),
};

export const stdSerializers = {
    req: noop,
    res: noop,
    err: (err: Error) => ({
        type: err?.name,
        message: err?.message,
        stack: err?.stack,
    }),
    wrapErrorSerializer: (s: any) => s,
    wrapRequestSerializer: (s: any) => s,
    wrapResponseSerializer: (s: any) => s,
};

export const stdTimeFunctions = {
    epochTime: () => `,"time":${Date.now()}`,
    unixTime: () => `,"time":${Math.round(Date.now() / 1000)}`,
    nullTime: () => '',
    isoTime: () => `,"time":"${new Date().toISOString()}"`,
};

function createLogger(opts?: any): any {
    const logger = {
        level: opts?.level ?? 'info',
        levels,
        trace: noop,
        debug: noop,
        info: noop,
        warn: noop,
        error: noop,
        fatal: noop,
        silent: noop,
        child: (bindings?: any) => createLogger({ ...opts, ...bindings }),
        bindings: () => ({}),
        flush: noop,
        isLevelEnabled: (lvl: string) =>
            (levelValues[lvl as keyof typeof levelValues] ?? 0) >=
            (levelValues[(opts?.level ?? 'info') as keyof typeof levelValues] ?? 0),
    };
    return logger;
}

const pino = Object.assign(createLogger, {
    levels,
    symbols,
    stdSerializers,
    stdTimeFunctions,
    destination: () => ({}),
    transport: () => ({}),
    multistream: () => ({}),
    final: () => createLogger(),
});

export { pino };
export default pino;
