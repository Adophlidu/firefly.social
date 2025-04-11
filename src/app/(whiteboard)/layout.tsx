import { setupLocaleForSSR } from '@/i18n/index.js';

export default async function DetailLayout({ children }: { children: React.ReactNode }) {
    await setupLocaleForSSR();
    return <>{children}</>;
}
