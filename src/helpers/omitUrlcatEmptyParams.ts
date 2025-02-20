import { omitBy } from 'lodash-es';

export function omitUrlcatEmptyParams<T extends object>(obj: T) {
    return omitBy(obj, (x) => typeof x === 'undefined' || x === '');
}
