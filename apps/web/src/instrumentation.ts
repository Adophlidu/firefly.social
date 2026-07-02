import { registerOTel } from '@vercel/otel';

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
function registerOpenTelemetry() {
    if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return;
    registerOTel({ serviceName: process.env.OTEL_SERVICE_NAME || 'firefly-web' });
}
