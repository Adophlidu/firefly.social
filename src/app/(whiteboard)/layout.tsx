import { type ReactNode } from 'react';

import { setupLocaleForSSR } from '@/i18n/index.js';

export default async function DetailLayout({ children }: { children: ReactNode }) {
    await setupLocaleForSSR();
    return <>{children}</>;
}
