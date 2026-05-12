# Bug Fix Case Studies

Cases are appended after each notable bug fix. Do NOT reorder or delete entries — the `retrospective` skill reads this file to analyze patterns and propose rule updates.

Each case follows this format:

```
## Case: <one-line symptom>
**Date**: YYYY-MM-DD | **Area**: apps/web | apps/wallet | packages/<name>
**Symptom**: What the user saw.
**Root Cause**: Why it happened.
**Fix**: What was changed (short).
**Catchable by**: <rule reference> or NEW
```

`Catchable by` should reference the rule that could have caught it:

- `CLAUDE.md: Restricted Patterns — clsx`
- `architecture.md: hook importing a component`
- `i18n.md: macro import path`
- `rn-ui.md: import from dist not src`
- `commit.md: branch naming`
- `NEW` if no existing rule covers it.

---

<!-- New cases are appended below this line -->
