import { multipliedBy } from '@/helpers/number';

export function formatFundingRate(funding: string, digits = 2) {
    const ratio = multipliedBy(funding, 100);
    if (ratio.isNaN()) return '-';
    if (ratio.isZero()) return '0';

    const [integer, fraction = ''] = ratio.toString().split('.');
    if (!fraction) return integer;
    if (fraction.length <= digits) return ratio.toString();

    let formattedFraction = '';
    let zeroIndex = 0;
    for (let i = 0; i < fraction.length; i += 1) {
        if (fraction[i] === '0') {
            zeroIndex = i;
            formattedFraction += '0';
            continue;
        }
        if (i - zeroIndex >= digits) {
            break;
        } else {
            formattedFraction += fraction[i];
        }
    }

    return `${integer}.${formattedFraction}`;
}
