import { classNames } from '@dimensiondev/utils';

/**
 * Static placeholder for the Perpetuals route, rendered on the server. Used as the
 * `<Suspense>` fallback so the shell is always present in the initial HTML — even
 * if the route is ever statically rendered and `useSearchParams` in the page falls
 * back to client-side rendering for its subtree.
 */
function Block({ className }: { className?: string }) {
    return <div className={classNames('animate-pulse rounded bg-[#efeff3]', className)} />;
}

const METRIC_KEYS = ['leverage', 'mark', 'oracle', 'change', 'volume', 'interest'] as const;
const BOOK_ROW_KEYS = ['b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9'] as const;
const PANEL_ROW_KEYS = ['p0', 'p1', 'p2'] as const;

export function PerpetualsSkeleton() {
    return (
        <div aria-hidden role="status" className="min-h-screen w-full overflow-x-hidden bg-white pb-16">
            <header className="flex h-[60px] items-center justify-between px-4">
                <Block className="h-6 w-28" />
                <div className="flex items-center gap-2">
                    <Block className="h-9 w-16" />
                    <Block className="h-9 w-16" />
                    <Block className="h-8 w-20" />
                </div>
            </header>

            <div className="flex h-[58px] items-center gap-4 border-b border-[#f5f5f5] px-3 py-2">
                <Block className="h-8 w-40 shrink-0" />
                <div className="flex min-w-0 items-center gap-6 overflow-hidden">
                    {METRIC_KEYS.map((key) => (
                        <div key={key} className="flex shrink-0 flex-col gap-1">
                            <Block className="h-3 w-14" />
                            <Block className="h-4 w-16" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col md:h-[557px] md:flex-row">
                <div className="flex min-w-0 flex-1 flex-col gap-3 border-b border-r border-[#f5f5f5] p-3">
                    <Block className="h-8 w-full" />
                    <Block className="min-h-[300px] flex-1" />
                </div>
                <div className="flex h-[557px] w-56 shrink-0 flex-col gap-3 border-y border-[#f5f5f5] p-3">
                    <Block className="h-12 w-full bg-[#dcf1d9]" />
                    <Block className="h-12 w-full bg-[#ffe6e4]" />
                    <div className="mt-2 flex flex-col gap-1.5">
                        {BOOK_ROW_KEYS.map((key) => (
                            <Block key={key} className="h-4 w-full" />
                        ))}
                    </div>
                </div>
            </div>

            <div className="px-4 pt-3">
                <div className="flex gap-8 border-b border-[#f5f5f5] pb-3">
                    <Block className="h-5 w-20" />
                    <Block className="h-5 w-24" />
                    <Block className="h-5 w-28" />
                </div>
                <div className="mt-4 flex flex-col gap-3">
                    {PANEL_ROW_KEYS.map((key) => (
                        <Block key={key} className="h-10 w-full" />
                    ))}
                </div>
            </div>
        </div>
    );
}
