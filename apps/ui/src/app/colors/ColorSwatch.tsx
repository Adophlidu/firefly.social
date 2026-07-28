interface ColorSwatchProps {
    name: string;
    className: string;
    cssVar: string;
    usage: string;
    /** apps/web usage count for this Tailwind class, across bg-/text-/border-/etc. utilities — see the GH issue for methodology. */
    count: number;
}

export function ColorSwatch({ name, className, cssVar, usage, count }: ColorSwatchProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-line">
            <div className={`h-16 w-full ${className}`} />
            <div className="p-3">
                <div className="flex items-center justify-between">
                    <p className="font-medium">{name}</p>
                    <span className="font-mono text-[10px] text-third">×{count}</span>
                </div>
                <p className="mt-0.5 font-mono text-xs text-second">{cssVar}</p>
                <p className="mt-1 text-xs text-second">{usage}</p>
            </div>
        </div>
    );
}
