export function BetEventLoading() {
    return (
        <div className="flex w-full flex-1 flex-col">
            {/* Header: image + title + close */}
            <div className="grid w-full grid-cols-[40px_1fr_36px] items-center gap-2 p-4">
                <div className="bg-lightBg size-10 animate-pulse rounded-lg" />
                <div className="flex flex-col gap-1.5">
                    <div className="bg-lightBg h-4 w-4/5 animate-pulse rounded" />
                    <div className="bg-lightBg h-4 w-3/5 animate-pulse rounded" />
                </div>
                <div className="bg-lightBg size-6 animate-pulse rounded" />
            </div>
            {/* Buy/Sell tabs + Market/Limit toggle */}
            <div className="flex h-8 items-center justify-between px-4">
                <div className="bg-lightBg h-7 w-28 animate-pulse rounded-full" />
                <div className="bg-lightBg h-5 w-16 animate-pulse rounded" />
            </div>
            {/* Outcome buttons */}
            <div className="grid w-full grid-cols-2 gap-3 px-4 pt-4">
                <div className="bg-lightBg h-10 animate-pulse rounded-lg" />
                <div className="bg-lightBg h-10 animate-pulse rounded-lg" />
            </div>
            {/* Form area */}
            <div className="flex flex-col gap-3 px-4 pt-6">
                <div className="bg-lightBg h-5 w-20 animate-pulse rounded" />
                <div className="bg-lightBg h-12 w-full animate-pulse rounded-xl" />
                <div className="bg-lightBg h-5 w-24 animate-pulse rounded" />
                <div className="bg-lightBg h-12 w-full animate-pulse rounded-full" />
            </div>
        </div>
    );
}
