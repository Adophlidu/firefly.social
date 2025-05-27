'use client';

import { Action, Blink } from '@dialectlabs/blinks';
import { memo } from 'react';
import { useMount } from 'react-use';

import { parseUrl } from '@/helpers/parseUrl.js';
import { useActionAdapter } from '@/hooks/useActionAdapter.js';
import { captureBlinkAppearEvent } from '@/providers/telemetry/captureBlinkActionEvent.js';

export const ActionContainer = memo<{
    action: Action;
    url?: string;
}>(function ActionContainer({ action }) {
    const parsed = parseUrl(action.url);
    const adapter = useActionAdapter();
    useMount(() => {
        captureBlinkAppearEvent(action.url);
    });

    return (
        <div
            className="mt-3"
            onClick={(e) => {
                e.stopPropagation();
            }}
        >
            <Blink blink={action} adapter={adapter} websiteUrl={parsed?.origin} websiteText={parsed?.host} />
        </div>
    );
});
