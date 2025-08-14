interface InfoCardProps {
    title?: React.ReactNode;
    description?: React.ReactNode;
    children?: React.ReactNode;
}

export function InfoCard({ title, description, children }: InfoCardProps) {
    return (
        <div className="flex h-[232px] w-full flex-col items-center justify-center gap-2 px-4">
            {title ? <h3 className="text-lg font-bold">{title}</h3> : null}
            {description ? <p className="text-sm">{description}</p> : null}
            {children}
        </div>
    );
}
