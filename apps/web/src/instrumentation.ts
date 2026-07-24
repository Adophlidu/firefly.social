import { OTLPHttpJsonTraceExporter, OTLPHttpProtoTraceExporter, registerOTel } from '@vercel/otel';

// Runs once when a server instance boots (incl. Vercel serverless/production).
export async function register() {
    registerOpenTelemetry();
    // Node-only setup lives in a separate module so the Edge Runtime never compiles
    // its Node API usage (e.g. process.emitWarning).
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('@/instrumentation-node.js');
    }
}

// Sends traces to the Firefly OTel collector when an OTLP endpoint is configured.
// Endpoint + ingest token come from env (OTEL_EXPORTER_OTLP_ENDPOINT / _HEADERS),
// set in the Vercel project. No endpoint (e.g. local dev) → OTel stays off.
//
// The exporter is built explicitly (rather than relying on @vercel/otel's "auto"
// mode) because Vercel injects VERCEL_OTEL_ENDPOINTS into every Function, and in
// "auto" mode that silently redirects all spans to Vercel's own local collector,
// never reading OTEL_EXPORTER_OTLP_ENDPOINT/_HEADERS at all (vercel/otel#69).
function registerOpenTelemetry() {
    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    if (!endpoint) return;
    const exporterConfig = {
        url: `${endpoint}/v1/traces`,
        headers: parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
    };
    const protocol = process.env.OTEL_EXPORTER_OTLP_TRACES_PROTOCOL || process.env.OTEL_EXPORTER_OTLP_PROTOCOL;
    registerOTel({
        serviceName: process.env.OTEL_SERVICE_NAME || 'firefly-web',
        traceExporter:
            protocol === 'http/json'
                ? new OTLPHttpJsonTraceExporter(exporterConfig)
                : new OTLPHttpProtoTraceExporter(exporterConfig),
    });
}

// OTEL_EXPORTER_OTLP_HEADERS format per the OTel spec: comma-separated `key=value` pairs.
function parseOtlpHeaders(raw: string | undefined): Record<string, string> {
    if (!raw) return {};
    return Object.fromEntries(
        raw.split(',').map((pair) => {
            const [key, ...rest] = pair.split('=');
            return [key.trim(), decodeURIComponent(rest.join('=').trim())];
        }),
    );
}
