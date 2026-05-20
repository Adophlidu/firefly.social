// Runtime stub for @lingui/core/macro used in Vitest (no SWC/Babel macro transform).
// Returns the raw template string so helpers are testable without i18n context.
export function t(strings: TemplateStringsArray, ...values: unknown[]): string {
    return strings.reduce((acc, str, i) => acc + str + (i < values.length ? String(values[i]) : ''), '');
}
