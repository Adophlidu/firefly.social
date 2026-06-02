'use client';

import { memo, useEffect, useState } from 'react';

import { FireflyUnauthorizedError } from '@/constants/error.js';
import { EVENT_FIREFLY_SESSION_UNAUTHORIZED } from '@/constants/event.js';
import { listenCustomEvent } from '@/helpers/dispatchCustomEvents.js';

/**
 * Bridges the (non-React) unauthorized event to the React tree so it reaches the
 * global error boundary. Mounted high in the root layout — outside the routed
 * `{children}` — it sits above every segment-level `error.tsx`, so throwing here
 * propagates all the way up to `app/global-error.tsx`, which renders the
 * signed-out screen. Session cleanup is handled separately in
 * `useWatchAccountChange`; this component only drives the boundary.
 */
export const SessionUnauthorizedBoundaryTrigger = memo(function SessionUnauthorizedBoundaryTrigger() {
    const [unauthorized, setUnauthorized] = useState(false);

    useEffect(() => listenCustomEvent(EVENT_FIREFLY_SESSION_UNAUTHORIZED, () => setUnauthorized(true)), []);

    if (unauthorized) throw new FireflyUnauthorizedError();

    return null;
});
