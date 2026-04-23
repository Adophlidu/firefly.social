export function formatCoinName(coinName: string) {
    const [_, ...rest] = coinName.split(':');

    if (!rest.length) return coinName;

    return rest.join(':');
}
