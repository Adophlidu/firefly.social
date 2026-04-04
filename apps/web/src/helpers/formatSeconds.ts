function resolveSeconds(timeInSeconds: number) {
    if (!Number.isNaN(timeInSeconds) && Number.isFinite(timeInSeconds) && timeInSeconds > 0) {
        const roundedValue = Math.round(timeInSeconds);
        const hours = Math.floor(roundedValue / 3600);
        const seconds = Math.floor(roundedValue % 60);

        return {
            hours: hours > 0 ? hours : 0,
            minutes: hours > 0 ? Math.floor((roundedValue % 3600) / 60) : Math.floor(roundedValue / 60),
            seconds,
        };
    }

    return {
        hours: 0,
        minutes: 0,
        seconds: 0,
    };
}

export function formatSecondsToHours(timeInSeconds: number) {
    const { hours, minutes, seconds } = resolveSeconds(timeInSeconds);
    if (seconds || minutes || hours) {
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds < 10 ? '0' : ''}${seconds}`;
        }

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    return '0:00';
}
