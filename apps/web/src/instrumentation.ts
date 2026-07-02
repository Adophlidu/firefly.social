import { registerOTel } from '@vercel/otel';

// Runs once when a server instance boots (incl. Vercel serverless/production).
export function register() {
    registerOpenTelemetry();
    suppressNonActionableWarnings();
}

// Sends traces to the Firefly OTel collector when an OTLP endpoint is configured.
// Endpoint + ingest token come from env (OTEL_EXPORTER_OTLP_ENDPOINT / _HEADERS),
// set in the Vercel project. No endpoint (e.g. local dev) → OTel stays off.
function registerOpenTelemetry() {
    if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return;
    registerOTel({ serviceName: process.env.OTEL_SERVICE_NAME || 'firefly-web' });
}

// Swallows a single non-actionable deprecation warning (DEP0169: `url.parse()`)
// emitted by transitive dependencies, while leaving every other warning intact.
function suppressNonActionableWarnings() {
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
