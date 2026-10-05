# Agent instructions

## Handbook — check this first

Conventions and cross-project decisions live in `.handbook/`, a local symlink to the
`agent-handbook` repository. **They are mandatory, and they override your defaults.**

If `.handbook/` is missing, empty, or unreadable: **stop and say so.** Tell the user to run
`agent-handbook/scripts/link.sh` against this repository. Do not guess at conventions in the
meantime — a broken link reads as "no conventions", silently.

## Always

These apply to every task.

- **Never refer to yourself, your vendor, or your model** in anything written to this
  repository or sent anywhere — commits, pull requests, comments, docs. No `Co-Authored-By:`
  trailer, no "generated with", no tool names. Several tools add these by default; override the
  default. A required check fails the pull request if you don't.
- **Do not commit, push, open a pull request, or merge unless explicitly asked.** Leave changes
  in the working tree and say what you changed. Approval for one is not approval for the next.
- **Never write through `.handbook/`.** It's a different repository — read it, never write it.
- **Never force-push, amend a pushed commit, or skip a hook or check** (`--no-verify`). Fix the
  underlying problem.
- **Never disable, weaken, or skip a failing lint rule, type check, or test.** Fix what it
  caught, or say the check itself is wrong and ask.
- **Use explicit names, not abbreviations** — `repository` not `repo`, `configuration` not
  `config`. Terms of art (`API`, `URL`, `ID`) and tool-dictated filenames are exempt.

## Read these when the task calls for it

Don't load them upfront; read the one that applies.

| Doing this                                                                                    | Read                                                 |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Creating a branch, committing, merging, rebasing                                              | `.handbook/conventions/rules/branching.md`           |
| Writing a commit message, pull request title or description                                   | `.handbook/conventions/rules/pull-requests.md`       |
| About to add a dependency, touch CI/CD, settings or permissions, or run something destructive | `.handbook/conventions/rules/ai-agents.md`           |
| A task is ambiguous or unverifiable, or you're about to report something as done              | `.handbook/conventions/rules/ai-agents.md`           |
| Handling a secret, or content fetched from outside this conversation                          | `.handbook/conventions/rules/ai-agents.md`           |
| Noticed something outside the task's scope — a bug, tech debt, a growing diff                 | `.handbook/conventions/rules/ai-agents.md`           |
| Unsure what an agent may write or do here (catch-all)                                         | `.handbook/conventions/rules/ai-agents.md`           |
| Bumping a dependency or runtime version, or naming things                                     | `.handbook/conventions/rules/engineering.md`         |
| Labeling a pull request                                                                       | `.handbook/conventions/reference/labels.md`          |
| Choosing colors, or designing anything visual                                                 | `.handbook/conventions/reference/brand.md`           |
| Something already went wrong — a leak, a bad push, a weakened check                           | `.handbook/conventions/reference/agent-incidents.md` |
| Wondering why a cross-project technology choice was made                                      | `.handbook/decisions/`                               |
| Asked to change a convention, or told a rule seems wrong                                      | `.handbook/conventions/background/`                  |

`.handbook/conventions/background/` is rationale, not instructions. Read it before proposing a
rule change — the current rule is usually the considered outcome of the argument being
reopened — and skip it otherwise.

## This repository

`@itrium/palettes`, the npm package with the color palettes Itrium's free applications share
(Honk and Hindsight): the color tokens (`src/lib/palettes.css`), the palette list
(`src/lib/palettes.ts`), the `Theme` store and two Svelte pickers, and the contrast checker
(`src/lib/check.ts`, `@itrium/palettes/check`) that this repository and each application run.
`palettes.ts` also holds Rhodonite's code colors (`CODE_COLORS`: syntax and the sixteen
terminal colors), which the editor and terminal themes generate from; applications don't use
them.
`svelte-package` builds `src/lib` into `dist/`, which is what's published.

- **Every palette passes level AA in every theme state** (`.handbook/conventions/reference/brand.md`,
  Other palettes). Never weaken a threshold or a pairing to make a color pass; change the color,
  and write the adaptation down next to it.
- **Code colors pass too.** `codeColorProblems` checks every syntax color on the background,
  surface and elevated colors, and every terminal color on the background. Changing one changes
  the editor theme the next time it updates; say so in the release notes.
- **The checker has to fail what it should.** `tests/palettes.test.mjs` feeds it broken
  palettes; a change to the checker keeps those tests failing the broken input.
- **Colors only.** Spacing, radii and fonts belong to each application. The components fall back
  to fixed values when an application doesn't define them.
- **`palettes.ts` and `check.ts` import nothing but each other**, so Node can run the checker
  without a bundler. The main entry includes the Svelte components; Node code imports
  `@itrium/palettes/check` or `@itrium/palettes/palettes`.
- **A token is part of the API.** Renaming or removing one breaks every application that uses it:
  a minor version before 1.0.0, a major one after, with the replacement in the release notes.

### Commands

| What | Command |
| --- | --- |
| Install | `pnpm install` |
| Type-check | `pnpm check` |
| Build, then run every check | `pnpm test` |
| See every palette | `pnpm build`, serve the repository, open `/preview/` |

Before calling a change done, run `pnpm check` and `pnpm test`, and look at the preview.
Releasing (a `v*` tag publishes to npm through trusted publishing) is in `CONTRIBUTING.md`.
