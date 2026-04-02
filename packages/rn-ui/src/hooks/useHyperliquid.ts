import { useContext } from 'react';

import { HyperliquidContext } from '@/providers/HyperliquidProvider';

export function useHyperliquid() {
    const context = useContext(HyperliquidContext);
    if (!context) {
        throw new Error('useHyperliquid must be used within HyperliquidProvider');
    }
    return context;
}
