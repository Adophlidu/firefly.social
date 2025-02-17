'use client';

import { useEffect, useState } from 'react';

import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { type EventItem } from '@/types/bridge.js';

interface Props {
    item: EventItem;
}

export function BridgeEventCard({ item }: Props) {
    const [payload, setPayload] = useState<string>();

    useEffect(() => {
        return fireflyBridgeProvider.on(item.name, (payload) => {
            setPayload(JSON.stringify(payload, null, 2));
        });
    }, [item.name]);

    return (
        <div>
            <pre>{payload}</pre>
        </div>
    );
}
