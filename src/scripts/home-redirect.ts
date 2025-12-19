const pathnameToCheck = ['/', '/following/posts', '/posts'];
const fireflyStorageKey = 'firefly-state';
const signupPathname = '/signup';

function parseJson<T>(jsonString: string) {
    try {
        return JSON.parse(jsonString) as T;
    } catch {
        return null;
    }
}

function redirectToSignup() {
    const pathname = location.pathname;
    if (!pathnameToCheck.includes(pathname)) return;

    const fireflyProfile = parseJson<{ state: { currentProfileSession: string | null } }>(
        localStorage.getItem(fireflyStorageKey) || '',
    );
    if (fireflyProfile?.state?.currentProfileSession) return;

    window.location.href = signupPathname;
}

try {
    redirectToSignup();
} catch {}
