/**
 * Strip the app basepath from a URL pathname. Pathnames outside the
 * basepath are returned unchanged.
 */
export function stripBasepath(pathname: string, basepath?: string): string {
    if (!basepath || basepath === '/') return pathname;
    if (pathname === basepath) return '/';
    if (pathname.startsWith(`${basepath}/`)) return pathname.slice(basepath.length);
    return pathname;
}

/** Join an app-relative pathname with the app basepath. */
export function withBasepath(pathname: string, basepath?: string): string {
    if (!basepath || basepath === '/') return pathname;
    if (pathname === '/') return basepath;
    return `${basepath}${pathname}`;
}
