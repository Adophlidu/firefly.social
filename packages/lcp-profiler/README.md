# `@dimensiondev/lcp-profiler`

API call performance profiling for React and Next.js: track external `fetch` traffic and correlate it with **LCP** (Largest Contentful Paint) via the Performance Observer API.

## Overview

The profiler records external API calls and relates them to Web Vitals—especially LCP—so you can see which requests finish before LCP and may affect perceived load time.

## Installation

In this monorepo (pnpm workspace):

```bash
pnpm add @dimensiondev/lcp-profiler @dimensiondev/utils
```

`@dimensiondev/utils` is required for URL parsing inside the tracker.

## Features

- Automatic tracking of external API calls (when you wrap `fetch` with `trackApiCall`)
- Correlation with LCP timing (calls before / after LCP)
- Metrics: duration, status, domain, method, optional headers and resource timing
- Export reports as JSON (`exportPerformanceData`, `getPerformanceReport`)
- Configurable thresholds, domain exclusions, and callbacks
- **Zero bundle cost when disabled** if you gate dynamic imports and config (see integration notes below)

## Programmatic usage

```typescript
import {
    initPerformanceProfiling,
    getPerformanceReport,
    exportPerformanceData,
    clearPerformanceData,
    type PerformanceConfig,
} from '@dimensiondev/lcp-profiler';

initPerformanceProfiling({
    enabled: true,
    trackExternalOnly: true,
    minDurationThreshold: 0,
    maxTrackedCalls: 1000,
    detailedTiming: true,
    captureStackTrace: false,
    excludedDomains: [],
});

const report = getPerformanceReport();
console.log(report.summary);

const json = exportPerformanceData();
```

Wrap your fetch implementation when tracking is on:

```typescript
import {
    isTrackingEnabled,
    trackApiCall,
} from '@dimensiondev/lcp-profiler';

if (isTrackingEnabled()) {
    return trackApiCall(urlString, init, () =>
        yourFetch(url, init),
    );
}
return yourFetch(url, init);
```

Call `initPerformanceProfiling` on the client so the LCP observer runs (`typeof window !== 'undefined'` is handled inside the library).

## Configuration

`PerformanceConfig` fields include:

| Option                 | Description                                                 |
| ---------------------- | ----------------------------------------------------------- |
| `enabled`              | Master switch                                               |
| `trackExternalOnly`    | If true, same-origin requests are skipped in the browser    |
| `minDurationThreshold` | Minimum duration (ms) to record successful calls            |
| `maxTrackedCalls`      | Cap stored calls (store trims oldest batch when full)       |
| `detailedTiming`       | Attach `PerformanceResourceTiming` when available           |
| `captureStackTrace`    | Capture a short stack (client only; avoid in production)    |
| `excludedDomains`      | Substring match on hostname; matching hosts are skipped     |
| `onApiCallComplete`    | Hook per completed metric                                   |
| `onReportGenerated`    | Hook when a report is built (if you extend the store usage) |

### `WebVitalsInitOptions`

Pass a second argument to `initPerformanceProfiling` to handle observer setup errors:

```typescript
initPerformanceProfiling(config, {
    onObserverError: (err) => console.warn(err),
});
```

---

## Firefly Social app (reference integration)

The following sections describe how profiling is wired in **this** repository: env flag, dashboard UI, and file paths. Other apps can mirror the pattern with their own env and UI.

### Enable profiling

```bash
NEXT_PUBLIC_API_PERFORMANCE_PROFILING=enabled
```

Or in `.env.local`:

```env
NEXT_PUBLIC_API_PERFORMANCE_PROFILING=enabled
```

(The app validates this with its `STATUS` enum; use the value your schema expects, e.g. `enabled`.)

### Access the dashboard

When enabled, a floating **LCP Perf** control appears (bottom-right). Color indicates rough health:

- **Green**: No major issues flagged by the dashboard rules
- **Yellow**: Medium-priority calls before LCP (e.g. 100–500ms)
- **Red**: High-priority calls before LCP (e.g. over 500ms), often with a count badge

**Keyboard shortcut:** `Ctrl+P` / `Cmd+P` toggles the dashboard (when not captured by the browser print dialog).

### Using the dashboard

#### Summary cards

- **Total API calls**
- **Total duration**
- **Average duration**
- **Calls before LCP**

#### Domain breakdown

Calls grouped by domain (by count). Click a domain to filter.

#### API calls table

Method, URL (with copy), duration (highlighted when slow), status, before-LCP flag, domain.

#### Slowest calls before LCP

Use this list first when hunting LCP-related backend delay.

### Exporting data

**Export JSON** downloads the full in-memory report (metrics, LCP timing, summary). The Firefly dashboard refreshes on an interval so you usually do not need a manual refresh.

---

## Identifying bottlenecks

1. **Status bubble** — Red + badge: prioritize very slow calls before LCP.
2. **Priority bands** — High (over 500ms before LCP), medium (100–500ms), low (under 100ms).
3. **Slow calls** — Anything over 500ms deserves investigation; over 1000ms is critical.
4. **Domains** — Many slow calls to one host → caching, CDN, batching, or API changes.
5. **Sequential work before LCP** — Parallelize, merge endpoints, or reduce round-trips.

## Example analysis

```json
{
    "summary": {
        "totalCalls": 45,
        "totalDuration": 2340.5,
        "averageDuration": 52.01,
        "callsBeforeLCP": 12,
        "totalDurationBeforeLCP": 890.3
    },
    "apiCallsBeforeLCP": [
        {
            "domain": "api.example.com",
            "url": "https://api.example.com/v1/profile",
            "duration": 450.2,
            "method": "GET"
        }
    ]
}
```

Here, 12 calls finished before LCP (~890ms total); the slowest example is ~450ms on profile—good candidate to cache or speed up.

## Best practices

1. Enable during development to catch regressions early.
2. Use a feature flag in production if you need real-user data.
3. Export reports occasionally to track trends.
4. Focus on **before-LCP** work first.
5. Raise `minDurationThreshold` if the trace is too noisy.

## Troubleshooting

### Dashboard not appearing (Firefly)

- Confirm `NEXT_PUBLIC_API_PERFORMANCE_PROFILING` is set to your app’s enabled value.
- Dashboard is client-only.
- Check the console for errors.

### No data

- Ensure requests actually run through the wrapped `fetch`.
- With `trackExternalOnly: true`, same-origin URLs are skipped in the browser.
- Check `excludedDomains`.

### Performance impact

- Overhead is typically small per request; increase `minDurationThreshold` or disable `captureStackTrace` in production if needed.

## Technical details

### How it works

1. **Gating** — Load tracker code only when your app enables profiling (dynamic `import` recommended).
2. **Fetch wrapping** — `trackApiCall` measures around your real `fetch`.
3. **LCP** — `PerformanceObserver` for `largest-contentful-paint` updates the shared store.
4. **Storage** — In-memory only (not persisted).
5. **Firefly dashboard** — Polls / refreshes on an interval for live views.

### Package layout

```
packages/lcp-profiler/src/
├── index.ts          # Public API
├── types.ts          # TypeScript types
├── store.ts          # In-memory metrics + report generation
├── tracker.ts        # trackApiCall / config
├── webVitals.ts      # LCP observer
└── isSameUrl.ts      # Duplicate GET grouping in reports
```

### Firefly integration points (this repo)

| Area                                             | Role                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| `src/helpers/initPerformanceProfilingFromEnv.ts` | Env-driven `initPerformanceProfiling` + Firefly `excludedDomains` |
| `src/helpers/fetch.ts`                           | Dynamic import + `trackApiCall` when flag enabled                 |
| `src/components/InitialProviders.tsx`            | Client bootstrap for profiling                                    |
| `src/app/layout-body.tsx`                        | Renders `PerformanceDashboard` when enabled                       |

## Related documentation (monorepo)

- [Performance Guide](../../docs/PERFORMANCE_GUIDE.md)
- [Performance Improvements](../../docs/PERFORMANCE_IMPROVEMENTS.md)
