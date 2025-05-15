'use client';

import { NavigatorBarForMobile } from '@/components/NavigatorBar/NavigatorBarForMobile.js';

export function NavigatorBar() {
    return <NavigatorBarForMobile enableSearch={false} enableFixedBack />;
}
