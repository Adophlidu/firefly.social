'use client';

import { bom } from '@dimensiondev/utils';

import { getMobileDevice } from '@/helpers/getMobileDevice.js';

const ua = bom.navigator?.userAgent;

export const IS_SAFARI = !!(ua?.toLowerCase().includes('safari') && !ua?.toLowerCase().includes('chrome'));
export const IS_APPLE = !!ua?.toLowerCase().includes('apple');
export const IS_IOS = !!ua?.match(/(iPhone|iPod|iPad)/);
export const IS_FIREFOX = !!ua?.toLowerCase().includes('firefox');
export const IS_ANDROID = !!ua?.toLowerCase().includes('android');

export const IS_MOBILE_DEVICE = getMobileDevice() !== 'unknown';

export enum Node {
    ELEMENT_NODE = 1,
    ATTRIBUTE_NODE = 2,
    TEXT_NODE = 3,
    CDATA_SECTION_NODE = 4,
    ENTITY_REFERENCE_NODE = 5,
    ENTITY_NODE = 6,
    PROCESSING_INSTRUCTION_NODE = 7,
    COMMENT_NODE = 8,
    DOCUMENT_NODE = 9,
    DOCUMENT_TYPE_NODE = 10,
    DOCUMENT_FRAGMENT_NODE = 11,
    NOTATION_NODE = 12,
}
