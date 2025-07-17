'use client';

import { useEffect, useState } from 'react';
import { useAccount, useSwitchAccount } from 'wagmi';

import { PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';

export function DynamicPrivyBridge() {
    const [isSetup, setIsSetup] = useState(false);
    const isLogin = useIsLoginFirefly();
    useEffect(() => {
        if (!isLogin) return;
        import('@/components/PrivyBridge.js').then(() => {
            setIsSetup(true);
        });
    }, [isLogin]);

    const { connector } = useAccount();
    const { switchAccountAsync } = useSwitchAccount();

    // When logging out, switch to a connector that is not privy
    useEffect(() => {
        if (!isLogin && connector?.id === PRIVY_CONNECTOR_ID) {
            switchAccountAsync({ connector });
        }
    }, [connector, isLogin, switchAccountAsync]);

    return isSetup && isLogin ? <privy-bridge /> : null;
}
