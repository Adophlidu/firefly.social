import { lazyObject } from '@/helpers/lazyObject.js';
import * as ABICoder from /* webpackDefer: true */ 'web3-eth-abi';

export const abiCoder = lazyObject(() => ABICoder.default) as unknown as ABICoder.AbiCoder;
