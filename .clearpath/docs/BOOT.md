---
id: clearpath-boot
type: boot-index
status: active
canonical: true
---
# Clearpath Boot Index

Read this file first. It is the startup index for Clearpath state.

## Reading Rule
Do not read all Clearpath artifacts. Read `CURRENT_CONTEXT.md`, then use `ARTIFACT_INDEX.json` and active `CHANGE_INDEX.md` to retrieve only what the current phase requires.

<!-- CLEARPATH_INDEX_START -->
## Generated Current Pointers
- Current phase: unknown
- Active change: none
- Artifact index: .clearpath/docs/ARTIFACT_INDEX.json
- Current context: .clearpath/docs/CURRENT_CONTEXT.md
- Prototype root: .clearpath/prototype/
<!-- CLEARPATH_INDEX_END -->

## Workflow Modes
- `new-product`: building from scratch.
- `existing-clearpath`: continuing a project that already uses Clearpath.
- `adopt-existing`: continuing a product that has never used Clearpath.

The Autopilot router uses the same names with a `Mode:` prefix when
written to `.clearpath/docs/AUTOPILOT.md`. See `/clearpath:go` and
`docs/AUTOPILOT.md` for the routing contract.

## Required MCP Layer
- Serena: symbol navigation and reference lookup.
- Codebase-Memory: large-repo indexing and knowledge graph.
- Chrome DevTools: browser QA and runtime evidence.
- CursorTouch/Windows-MCP: Windows native UI testing (opt-in per
  project; default-deny PowerShell/Registry/FileSystem/Process).

## Verification Routing
- Web UI: see `/clearpath:verify-web` for the Playwright (regression
  /E2E) and Chrome DevTools MCP (live inspect/debug) split.
- Windows native UI: see `/clearpath:verify-windows` for
  CursorTouch/Windows-MCP usage and the safety boundary.
- Other platforms: use `/clearpath:qa` Chrome DevTools MCP browser
  QA.

## Prototypes

All UI prototypes live under `.clearpath/prototype/`. Use **HTML**
and **Tailwind CSS** only (Tailwind CDN in `index.html`).

## Screenshot evidence (Chrome DevTools MCP)

When capturing browser screenshots, **always** pass `filePath` on
`take_screenshot`. Do not rely on the MCP default — without
`filePath`, large images land in the OS temp folder
(`%TEMP%/chrome-devtools-mcp-*` on Windows).

**Primary location** (active change pack):

`.clearpath/docs/changes/<change-id>/evidence/<name>.png`

**Fallback** (no change pack yet):

`.clearpath/prototype/screenshots/<name>.png`

Workflow:

1. `navigate` to the prototype or app URL.
2. `take_screenshot` with `filePath` set to a workspace path above.
   Use `fullPage: true` for design review; viewport-only for a
   specific state.
3. Link the saved path in `UI_CONTRACT.md`, `DESIGN_REVIEW.md`,
   `QA.md`, or `evidence/EVIDENCE_INDEX.md`.

Create the `evidence/` directory before the first screenshot. Use
descriptive names (`prototype-home.png`, `error-state.png`).

## Required user-scope skills

Design work requires these skills in `~/.claude/skills/`:

- `design-taste-frontend`
- `impeccable`

Run `/clearpath:doctor` to verify. The agent may install missing
skills/MCP to user scope after you approve.

## Design Approval

Design approval happens in chat. The agent presents the prototype,
asks the user to **Approve** or **Request changes**, and continues
implementation only after approval. Record the decision in
`DESIGN_APPROVAL.md` in the active change pack.
