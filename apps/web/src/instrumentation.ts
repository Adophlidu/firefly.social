// Runs once when a server instance boots (incl. Vercel serverless/production).
// Swallows a single non-actionable deprecation warning (DEP0169: `url.parse()`)
// emitted by transitive dependencies, while leaving every other warning intact.
export function register() {
    if (process.env.NEXT_RUNTIME !== 'nodejs') return;

    const IGNORED_CODES = new Set(['DEP0169']);
    const emitWarning = process.emitWarning.bind(process);

    process.emitWarning = function (warning: string | Error, ...args: unknown[]) {
        const first = args[0];
        const code =
            typeof first === 'object' && first !== null ? (first as { code?: string }).code : (args[1] as string);
        if (typeof code === 'string' && IGNORED_CODES.has(code)) return;
        // @ts-expect-error forwarding the original variadic signature
        return emitWarning(warning, ...args);
    };
}
