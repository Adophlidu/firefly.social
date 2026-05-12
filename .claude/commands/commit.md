# Claude Command: Commit

Helps create well-formatted commits with pre-checks and conventional commit messages.

## Usage

```
/commit
```

## What This Command Does

1. Checks current branch with `git branch --show-current`
2. **If on `main` or `released`**: STOP. Ask the user for a new branch name and run `git checkout -b <branch-name>` before continuing. NEVER commit directly to `main` or `released`.
3. Checks staged files with `git status`
4. If nothing staged, stages all modified files with `git add -u`
5. Runs pre-commit checks:
    - `pnpm typecheck` — TypeScript via tsgo (fast)
    - `pnpm lint` — ESLint 9 via Turbo
6. If checks fail, asks whether to fix first or proceed
7. Runs `git diff --staged` to analyze changes
8. Suggests splitting commits if multiple unrelated concerns are detected
9. Creates commit message in Firefly's conventional commit format

## Commit Format

`type(scope): description`

- `feat(scope):` — new feature
- `fix(scope):` — bug fix
- `chore(scope):` — tooling, config, deps
- `refactor(scope):` — code restructure without behavior change
- `docs(scope):` — documentation only

**Scope**: package or app name — e.g. `web`, `rn-ui`, `utils`, `exception-tracker`, `constants`

## Rules

- ❌ NEVER commit directly to `main` or `released` — always create a feature branch first
- ❌ Do NOT add "Co-Authored-By: Claude" or any AI attribution
- ❌ Do NOT commit if typecheck or lint fails (unless user explicitly asks)
- ✅ One commit per logical concern — suggest splitting if multiple concerns detected
- ✅ cspell checks commit messages — propose `cspell.json` additions for new technical terms
- ✅ Keep first line under 72 characters

## Branch Naming

When creating a new branch (because current is `main`/`released`), suggest a name based on the staged changes:

- `feat/<short-description>` — new feature
- `fix/<short-description>` — bug fix
- `chore/<short-description>` — tooling/config
- `refactor/<short-description>` — code restructure
