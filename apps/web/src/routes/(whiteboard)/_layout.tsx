import type { ReactNode } from 'react';

/**
 * Whiteboard group frame: bare pages (signup/login/frame/redirect/telegram)
 * with no site chrome. The group directory itself is what excludes these
 * pages from the (normal) frame — no pathname checks.
 */
export default function WhiteboardLayout({ children }: { children?: ReactNode }) {
    return <>{children}</>;
}
