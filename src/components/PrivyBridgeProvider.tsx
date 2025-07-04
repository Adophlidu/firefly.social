'use client';

import { useEffect, useState } from 'react';

export function PrivyBridgeProvider() {
    const [isSetup, setIsSetup] = useState(false);
    useEffect(() => {
        import('@/components/PrivyBridge.js').then(() => {
            setIsSetup(true);
        });
    }, []);

    return isSetup ? <privy-bridge /> : null;
}
