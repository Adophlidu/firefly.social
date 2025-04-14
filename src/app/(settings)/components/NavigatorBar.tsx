'use client';

import { NavigatorBarForMobile } from '@/components/NavigatorBar/NavigatorBarForMobile.js';
import { useNavigatorState } from '@/store/useNavigatorStore.js';

export function NavigatorBar() {
    const title = useNavigatorState.use.title();
    return <NavigatorBarForMobile title={title} enableSearch={false} enableFixedBack />;
}
