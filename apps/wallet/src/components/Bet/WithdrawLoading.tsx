export function WithdrawLoading() {
    return (
        <div className="flex min-h-0 w-full flex-1 flex-col px-4 pb-4">
            <div className="mt-auto space-y-4">
                <div className="flex h-12 w-full items-center">
                    <div className="bg-lightBg mr-3 size-9 animate-pulse rounded-full" />
                    <div className="flex flex-col items-start">
                        <div className="bg-lightBg h-3.5 w-20 animate-pulse rounded" />
                        <div className="bg-lightBg mt-1 h-3 w-16 animate-pulse rounded" />
                    </div>
                    <div className="bg-lightBg ml-auto h-3 w-16 animate-pulse rounded" />
                </div>
                <div className="flex items-center justify-between gap-4">
                    <div className="bg-lightBg h-8 w-[70px] animate-pulse rounded-full" />
                    <div className="bg-lightBg h-8 w-[70px] animate-pulse rounded-full" />
                    <div className="bg-lightBg h-8 w-[70px] animate-pulse rounded-full" />
                    <div className="bg-lightBg h-8 w-[70px] animate-pulse rounded-full" />
                </div>
                <div className="bg-lightBg h-12 w-full animate-pulse rounded-full" />
                <div className="bg-lightBg mx-auto mt-4 h-3.5 w-60 animate-pulse rounded" />
            </div>
        </div>
    );
}
