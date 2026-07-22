import { ThemeToggle } from '#/components/ThemeToggle.js';
import { Link } from '#/esm/Link.js';

export function Header() {
    return (
        <header className="border-b border-line">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
                <Link href="/" className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- plain <img>, no next/image shim in this app yet */}
                    <img src="/ui/logo.svg" alt="Firefly" height={28} className="h-7 w-auto" />
                    <span className="text-base font-semibold text-second">UI</span>
                </Link>
                <ThemeToggle />
            </div>
        </header>
    );
}
