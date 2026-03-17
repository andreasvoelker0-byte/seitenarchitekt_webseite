# AGENTS.md

## Current mode
This repository is currently in SEO and technical-fix mode.

## Main workflow
Work strictly one issue at a time.

Before making any change, always:
1. identify exactly one issue,
2. explain what the issue is,
3. explain why it matters,
4. state whether it is directly fixable in the codebase,
5. list the file(s) that would likely be changed,
6. describe the exact planned fix.

Then ask exactly:
"Soll ich diesen Fix umsetzen oder zum nächsten Punkt gehen?"

Do not make any change before the user answers.

If the user says no:
- do not change anything,
- continue with the next issue.

Never combine multiple fixes into one step.

## Scope
Only work on issues that are directly solvable in:
- code,
- project structure,
- metadata,
- assets,
- server configuration,
- build configuration.

## Verification rules
If an SEO audit report or PDF is provided:
- use it only as reference,
- do not trust it blindly,
- verify every reported issue in the actual code before proposing a fix,
- if the issue is already solved or not applicable, say so.

## Priority
Prioritize:
1. critical issues,
2. clearly verifiable issues,
3. quick technical wins.

## Constraints
- Do not redesign pages unless the user explicitly asks.
- Do not change architecture without asking.
- Do not do broad refactoring.
- Do not make cosmetic-only edits unless they are required for the fix.
- Do not rewrite content aggressively.
- Keep SEO improvements natural and avoid keyword stuffing.

## Excluded or limited topics
The following should only be reported, not automatically fixed:
- backlinks,
- referring domains,
- authority/offpage SEO,
- external indexing issues,
- third-party platform limitations.

## Output after each approved fix
After each implemented fix, briefly report:
- which files were changed,
- what was changed,
- what improvement was achieved.

## Stack awareness
Adapt all recommendations to the actual stack in the repository.
Do not assume React, Next.js, Astro, or plain HTML without checking first.