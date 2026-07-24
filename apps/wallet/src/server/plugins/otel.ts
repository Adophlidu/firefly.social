import { OTLPHttpJsonTraceExporter, OTLPHttpProtoTraceExporter, registerOTel } from '@vercel/otel';
import { definePlugin } from 'nitro';

// Sends traces to the Firefly OTel collector when an OTLP endpoint is configured.
// Endpoint + ingest token come from env (OTEL_EXPORTER_OTLP_ENDPOINT / _HEADERS),
// set in the Vercel project. No endpoint (e.g. local dev) → OTel stays off.
//
// Mirrors apps/web/src/instrumentation.ts. The exporter is built explicitly
// (rather than @vercel/otel's "auto" mode) because Vercel injects
// VERCEL_OTEL_ENDPOINTS into every Function, and in "auto" mode that silently
// redirects all spans to Vercel's own local collector, never reading
// OTEL_EXPORTER_OTLP_ENDPOINT/_HEADERS at all (vercel/otel#69).
export default definePlugin(() => {
    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    if (!endpoint) return;

    // Nitro's Vercel-preset "web entry format" wraps `process` in a portability
    // shim (shared across edge/workerd/deno targets) that omits
    // `process.versions.node`, even though the underlying Function runtime is
    // genuine Node.js. @vercel/otel's auto-instrumentation setup reads that
    // field (via a bundled is-core-module check) while registering core-module
    // require hooks, and throws "Unable to determine current node version" when
    // it's missing — which previously crashed every request. Backfill it from
    // `process.version` (present) before registerOTel touches anything.
    if (!process.versions?.node) {
        Object.defineProperty(process, 'versions', {
            value: { ...process.versions, node: process.version?.replace(/^v/, '') || '22.0.0' },
            configurable: true,
            writable: true,
        });
    }

    const exporterConfig = {
        url: `${endpoint}/v1/traces`,
        headers: parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
    };
    const protocol = process.env.OTEL_EXPORTER_OTLP_TRACES_PROTOCOL || process.env.OTEL_EXPORTER_OTLP_PROTOCOL;
    // Telemetry setup must never be able to take the app down — if this still
    // throws for some other environment-specific reason, fail open (no traces)
    // instead of failing the request.
    try {
        registerOTel({
            serviceName: process.env.OTEL_SERVICE_NAME || 'firefly-wallet',
            traceExporter:
                protocol === 'http/json'
                    ? new OTLPHttpJsonTraceExporter(exporterConfig)
                    : new OTLPHttpProtoTraceExporter(exporterConfig),
        });
    } catch (error) {
        console.error('[otel] registerOTel failed, continuing without tracing:', error);
    }
});

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
