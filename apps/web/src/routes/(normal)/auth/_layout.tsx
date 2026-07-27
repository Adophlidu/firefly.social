import type { ReactNode } from 'react';

/** Auth pages render their own NavigatorBar — suppress the frame's. */
export const topnav = () => null;

export default function AuthLayout({ children }: { children?: ReactNode }) {
    return <>{children}</>;
}
