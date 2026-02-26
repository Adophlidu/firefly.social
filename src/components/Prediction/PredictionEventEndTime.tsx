'use client';

interface PredictionEventEndTimeProps {
    endTime: number | string;
}

export function PredictionEventEndTime({ endTime }: PredictionEventEndTimeProps) {
    return (
        <span className="text-xs">
            {new Date(endTime).toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })}
        </span>
    );
}
