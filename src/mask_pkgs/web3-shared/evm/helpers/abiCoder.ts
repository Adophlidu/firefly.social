import * as ABICoder from /* webpackDefer: true */ 'web3-eth-abi';

import { lazyObject } from '@/helpers/lazyObject.js';

export const abiCoder = lazyObject(() => ABICoder.default) as unknown as ABICoder.AbiCoder;
