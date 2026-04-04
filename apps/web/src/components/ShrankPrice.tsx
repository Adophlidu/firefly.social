export function ShrankPrice({ shrank }: { shrank: string }) {
    if (!shrank.includes('{')) return shrank;
    const parts = shrank.match(/^(.+){(\d+)}(.+)$/);
    if (!parts) return shrank;
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            {parts[1]}
            <sub className="text-[0.66em]" style={{ fontSize: '0.66em', bottom: 0, lineHeight: 1 }}>
                {parts[2]}
            </sub>
            {parts[3]}
        </div>
    );
}
