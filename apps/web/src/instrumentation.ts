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
    const traceExporter =
        protocol === 'http/json'
            ? new OTLPHttpJsonTraceExporter(exporterConfig)
            : new OTLPHttpProtoTraceExporter(exporterConfig);
    registerOTel({
        serviceName: process.env.OTEL_SERVICE_NAME || 'firefly-web',
        traceExporter: truncateFetchSpanQueryStrings(dropUnreliableInternalSpans(traceExporter)),
    });
}

// Next.js's `NextNodeServer.clientComponentLoading` span reads a process-global
// (not per-request) counter that's only flushed inside a `req.on('end')` handler.
// Under Vercel Fluid Compute, concurrent requests share one warm instance, so that
// flush can fire on a request that didn't trigger the load — producing a span
// whose real start time is minutes older than its own parent span, which corrupts
// trace-duration stats (a 160ms render gets reported as several minutes long).
// Next.js has no per-request scoping or opt-out for this (see
// next/dist/server/{app-render/app-render,client-component-renderer-logger}.js),
// so it's dropped at the export boundary instead.
const UNRELIABLE_SPAN_NAMES = new Set(['NextNodeServer.clientComponentLoading']);

interface FilterableSpan {
    name: string;
}

interface FilterableSpanExporter {
    export(spans: FilterableSpan[], resultCallback: (result: { code: number }) => void): void;
    shutdown(): Promise<void>;
    forceFlush?(): Promise<void>;
}

function dropUnreliableInternalSpans(exporter: FilterableSpanExporter): FilterableSpanExporter {
    return {
        export(spans, resultCallback) {
            const filtered = spans.filter((span) => !UNRELIABLE_SPAN_NAMES.has(span.name));
            if (filtered.length === 0) {
                resultCallback({ code: 0 });
                return;
            }
            exporter.export(filtered, resultCallback);
        },
        shutdown: () => exporter.shutdown(),
        ...(exporter.forceFlush ? { forceFlush: () => exporter.forceFlush!() } : {}),
    };
}

// @vercel/otel's fetch instrumentation names every span `fetch <method> <full-url>`, query
// string included. Different query strings for the same endpoint (e.g. `?ids=...`) each
// become their own label series in Prometheus, fragmenting latency/rate aggregation for
// what's really one dependency. Truncate the span name only — attributes still carry the
// full URL — so equivalent calls aggregate into one series.
const FETCH_SPAN_NAME = /^(fetch \S+ https?:\/\/[^?]+)\?.*$/;

function truncateFetchSpanQueryStrings(exporter: FilterableSpanExporter): FilterableSpanExporter {
    return {
        export(spans, resultCallback) {
            for (const span of spans) {
                const match = FETCH_SPAN_NAME.exec(span.name);
                if (match) span.name = match[1];
            }

            exporter.export(spans, resultCallback);
        },
        shutdown: () => exporter.shutdown(),
        ...(exporter.forceFlush ? { forceFlush: () => exporter.forceFlush!() } : {}),
    };
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
