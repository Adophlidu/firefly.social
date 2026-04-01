'use strict';

/**
 * Tolgee’s PO_ICU handling for nplurals=1 locales can turn an untranslated
 * plural into a bogus ICU like `{value, plural, other {}}` instead of leaving
 * msgstr empty. Treat those as untranslated everywhere we touch PO files.
 *
 * @param {string} s
 * @returns {boolean}
 */
function isTolgeeEmptyPluralPlaceholder(s) {
    if (typeof s !== 'string' || s === '') return false;
    if (s === '{value, plural, other {}}') return true;
    return /^\{\s*[^,}]+\s*,\s*plural\s*,\s*other\s*\{\s*\}\s*\}$/.test(s);
}

module.exports = { isTolgeeEmptyPluralPlaceholder };
