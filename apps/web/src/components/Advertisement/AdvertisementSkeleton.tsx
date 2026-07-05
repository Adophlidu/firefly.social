// aspect-[346/130] matches the ad Image's intrinsic width/height (AdvertisementItem.tsx) instead
// of a fixed h-[130px]: the real image scales to the sidebar's actual width via that same ratio,
// which isn't exactly 346px wide, so a hardcoded height didn't match and caused a small shift
// once the real ad replaced the skeleton.
export function AdvertisementSkeleton() {
    return <div className="aspect-[346/130] w-full animate-pulse rounded-xl bg-bg" />;
}
