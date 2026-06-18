/**
 * Tracks failed resource URLs so we stop re-requesting them. Two layers:
 * - exact URL: a failed URL is never requested again.
 * - per-host breaker: after enough failures (e.g. a 429 storm) a whole host is
 *   skipped for a cooldown, then probed again.
 */

// Failures from one host before its breaker trips.
const HOST_FAILURE_THRESHOLD = 5;
// How long a tripped host is skipped before we probe it again.
const HOST_COOLDOWN = 30_000;

const failedUrls = new Set<string>();
const hostState = new Map<string, { failures: number; cooldownUntil: number }>();

function getHost(url: string): string | undefined {
    try {
        return new URL(url).host;
    } catch {
        return undefined;
    }
}

export function reportResourceFailure(url: string | undefined): void {
    if (!url) return;
    failedUrls.add(url);

    const host = getHost(url);
    if (!host) return;

    const state = hostState.get(host) ?? { failures: 0, cooldownUntil: 0 };
    state.failures += 1;
    if (state.failures >= HOST_FAILURE_THRESHOLD) {
        state.cooldownUntil = Date.now() + HOST_COOLDOWN;
    }
    hostState.set(host, state);
}

export function shouldSkipResource(url: string | undefined): boolean {
    if (!url) return false;
    if (failedUrls.has(url)) return true;

    const host = getHost(url);
    if (!host) return false;

    const state = hostState.get(host);
    if (!state) return false;

    if (Date.now() < state.cooldownUntil) return true;

    // Cooldown elapsed: reset so the host gets probed again.
    if (state.cooldownUntil) {
        state.failures = 0;
        state.cooldownUntil = 0;
    }
    return false;
}
