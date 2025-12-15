# LCP Performance Profiling Guide

This guide explains how to use the LCP Performance Profiling system to identify bottlenecks affecting LCP (Largest Contentful Paint) timing.

## Overview

The LCP Performance Profiling system tracks all external API calls made by your application and correlates them with Web Vitals metrics, particularly LCP. This helps you identify which API calls are blocking or delaying the LCP metric.

## Features

- ✅ Automatic tracking of all external API calls
- ✅ Correlation with LCP timing (identifies calls that happen before LCP)
- ✅ Detailed metrics: duration, status, domain, method, headers
- ✅ Visual dashboard for real-time monitoring with priority indicators
- ✅ Performance status bubble with color coding (red/yellow/green)
- ✅ High priority call count badge on status bubble
- ✅ Copy button for quick URL copying
- ✅ Export performance data as JSON
- ✅ Configurable via environment variables
- ✅ Zero overhead when disabled (conditional loading)

## Setup

### 1. Enable Profiling

Add the following environment variable to enable API performance profiling:

```bash
NEXT_PUBLIC_API_PERFORMANCE_PROFILING=enabled
```

Or in your `.env.local` file:

```env
NEXT_PUBLIC_API_PERFORMANCE_PROFILING=enabled
```

### 2. Access the Dashboard

Once enabled, you'll see a floating "LCP Perf" button in the bottom-right corner of your application. The button color indicates performance status:

- 🟢 **Green**: No performance issues detected
- 🟡 **Yellow**: Medium priority issues (100-500ms calls before LCP)
- 🔴 **Red**: High priority issues (>500ms calls before LCP) - shows count badge

Click the button to open the performance dashboard.

**Keyboard Shortcut**: Press `Ctrl+P` (or `Cmd+P` on Mac) to toggle the dashboard.

## Using the Dashboard

The dashboard provides several views:

### Summary Cards

- **Total API Calls**: Number of API calls tracked
- **Total Duration**: Cumulative time spent on all API calls
- **Avg Duration**: Average duration per API call
- **Calls Before LCP**: Number of API calls that completed before LCP

### Domain Breakdown

Shows API calls grouped by domain, sorted by call count. Click on a domain to filter calls.

### API Calls Table

Detailed table showing:

- HTTP method (GET, POST, etc.)
- Full URL with copy button for quick copying
- Duration (highlighted in red if >1000ms, orange if >500ms)
- HTTP status code
- Whether the call happened before LCP
- Domain

**Note**: Click the copy icon next to any URL to quickly copy it to your clipboard.

### Slowest Calls Before LCP

Highlights the slowest API calls that happened before LCP - these are your potential bottlenecks!

## Exporting Data

Click the "Export JSON" button in the dashboard header to download a complete performance report as JSON. This includes:

- All API call metrics
- LCP timing information
- Summary statistics
- Domain breakdowns

**Note**: The dashboard automatically refreshes every 2 seconds, so manual refresh is not needed.

## Programmatic Usage

You can also access performance data programmatically:

```typescript
import {
    getPerformanceReport,
    exportPerformanceData,
} from '@/providers/lcp';

// Get current report
const report = getPerformanceReport();
console.log(report.summary);

// Export as JSON string
const jsonData = exportPerformanceData();
```

## Configuration

You can customize the profiling behavior by modifying `src/providers/lcp/init.ts`:

```typescript
const config: Partial<PerformanceConfig> = {
    enabled: true,
    trackExternalOnly: true, // Only track external APIs
    minDurationThreshold: 0, // Minimum duration to track (ms)
    maxTrackedCalls: 1000, // Maximum calls to store
    detailedTiming: true, // Include Resource Timing API data
    captureStackTrace: true, // Capture stack traces (dev only)
    excludedDomains: [
        // Domains to exclude
        'media.firefly.land',
        'www.googletagmanager.com',
    ],
};
```

## Identifying Bottlenecks

### 1. Check the Status Bubble

The floating "LCP Perf" button provides immediate visual feedback:

- **Red with badge**: Shows count of high priority calls (>500ms before LCP) - optimize these first
- **Yellow**: Medium priority calls detected (100-500ms before LCP) - consider optimizing
- **Green**: No performance issues detected

### 2. Check Priority Sections

The dashboard automatically categorizes calls into:

- **High Priority** (>500ms before LCP): Must optimize - likely blocking LCP
- **Medium Priority** (100-500ms before LCP): Consider optimizing if critical for initial render
- **Low Priority** (<100ms before LCP): Usually fine, optimize only if blocking critical content

### 3. Look for Slow Calls

Any API call taking >500ms should be investigated. Calls >1000ms are critical.

### 4. Check Domain Patterns

If a specific domain has many slow calls, consider:

- Optimizing that API endpoint
- Adding caching
- Using a CDN
- Implementing request batching

### 5. Analyze Sequential Calls

If multiple API calls happen sequentially before LCP, consider:

- Parallelizing requests
- Combining endpoints
- Using GraphQL to reduce round trips

## Example Analysis

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
            "domain": "api.firefly.land",
            "url": "https://api.firefly.land/v1/profile",
            "duration": 450.2,
            "method": "GET"
        }
    ]
}
```

In this example:

- 12 API calls happened before LCP
- These calls took 890ms total
- The slowest call was 450ms to get profile data

**Action**: Optimize the profile API endpoint or add caching.

## Best Practices

1. **Enable in Development**: Always enable profiling during development to catch performance issues early.

2. **Monitor Production**: Consider enabling in production with a feature flag to monitor real-world performance.

3. **Regular Audits**: Export and analyze performance data regularly to track improvements.

4. **Focus on LCP**: Prioritize optimizing API calls that happen before LCP, as these directly impact user experience.

5. **Set Thresholds**: Configure `minDurationThreshold` to filter out noise from fast API calls.

## Troubleshooting

### Dashboard Not Appearing

- Check that `NEXT_PUBLIC_API_PERFORMANCE_PROFILING=Enabled` is set
- Ensure you're on the client side (dashboard is client-only)
- Check browser console for errors

### No Data Showing

- Make sure API calls are being made
- Check that calls are external (not same-origin if `trackExternalOnly` is true)
- Verify calls aren't excluded by domain filters

### Performance Impact

- Profiling has minimal overhead (~1-2ms per API call)
- If concerned, increase `minDurationThreshold` to track only slow calls
- Disable `captureStackTrace` in production

## Technical Details

### How It Works

1. **Conditional Loading**: Performance tracking code only loads when `NEXT_PUBLIC_API_PERFORMANCE_PROFILING=Enabled` - zero overhead when disabled
2. **Fetch Wrapping**: The `fetch` helper dynamically imports and wraps fetch calls with performance tracking (only when enabled)
3. **Web Vitals Integration**: Uses PerformanceObserver API to track LCP timing
4. **In-Memory Storage**: Metrics are stored in memory (not persisted)
5. **Real-time Updates**: Dashboard automatically refreshes every 2 seconds
6. **Priority Calculation**: Automatically categorizes calls by duration and LCP timing

### Architecture

```
src/providers/lcp/
├── index.ts          # Main entry point
├── types.ts          # TypeScript types
├── store.ts          # In-memory metrics store
├── tracker.ts        # API call tracking logic
├── webVitals.ts      # Web Vitals integration
└── init.ts           # Environment-based initialization
```

### Integration Points

- `src/helpers/fetch.ts` - Wraps fetch calls with tracking
- `src/components/InitialProviders.tsx` - Initializes profiling
- `src/app/layout-body.tsx` - Renders dashboard component

## Related Documentation

- [Performance Guide](./PERFORMANCE_GUIDE.md)
- [Performance Improvements](./PERFORMANCE_IMPROVEMENTS.md)
