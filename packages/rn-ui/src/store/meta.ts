import { infoClient } from '@/providers/client';
import { atomWithExpire } from '@/store/utils';

export const allMetaAtom = atomWithExpire(() => infoClient.allPerpMetas()).atom;
