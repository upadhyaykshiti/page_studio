# Page Studio — Write-up

## Problem framing

The brief asks for a small but real content-ops product: authorized users
load a page from a CMS, edit it visually, preview it, and publish an
immutable, versioned release — with correctness enforced by types, tests,
and CI rather than convention. The hard parts aren't the UI, they're the
seams: CMS ↔ app data, editor state ↔ rendered output, draft ↔ published,
and role ↔ permission. I optimized for making those seams explicit,
narrow, and testable, per the brief's instruction to prioritize
architecture, correctness, and automation over UI polish.

## Key decisions and trade-offs

**Single validation choke point.** Every page, whether from Contentful or
a Redux draft, passes through `safeParsePage`/`validateSection` before
render. This means the renderer, the publish endpoint, and the tests all
trust the same guarantee, and a malformed section degrades to
`UnsupportedSection` instead of crashing — verified by an explicit
`/preview/broken` fixture and e2e test rather than just an assertion in
the README.

**Registry as a type-level contract, not just a lookup table.** The
`sectionRegistry` object is declared `satisfies Record<SectionType, ...>`,
so removing an entry (or adding a type to the schema without a matching
component) is a compile error, not a runtime surprise — directly
satisfying "removing a registry entry breaks TS."

**Contentful isolated behind one adapter.** `contentfulClient.ts` is the
only file that imports the Contentful SDK; `contentfulAdapter.ts` is the
only file the rest of the app calls. I added a `CONTENT_SOURCE=mock` mode
backed by local fixtures with the identical shape a real adapter response
would have — this makes the whole app (including CI, which has no
Contentful credentials) runnable and testable without a live space, while
keeping the real integration path fully implemented and structurally
identical.

**RBAC enforced at the edge, not in components.** Middleware reads the
role cookie directly and redirects/403s before any page or API route code
executes; the publish route independently re-checks role as defense in
depth. UI affordances (disabled buttons, a `/api/whoami` read) are
explicitly documented as non-authoritative, so it's clear which layer is
the actual security boundary versus which is just good UX.

**Deterministic, id-keyed SemVer diffing.** Sections are matched by stable
`id` (not array index) so reordering never registers as add/remove noise.
Prop changes are classified by *key presence* (added key → minor, removed
key → major) versus *value change on an existing key* (patch), which maps
cleanly onto the brief's "optional prop added" vs "required prop broken"
distinction without needing a separate "is this prop required" schema
annotation.

**Idempotent, immutable publish.** A `null` diff short-circuits to a
`no-op` result instead of writing a new snapshot, and `publishDraft`
refuses to overwrite an existing version file. Both are covered by unit
tests (`semver.test.ts`) rather than only being true by construction.

**Keyboard-first section reordering.** I chose explicit up/down buttons
over drag-and-drop for the primary reorder mechanism, since drag-only
interfaces are a common AAA-keyboard-operability failure; this was a
deliberate accessibility trade-off against a "nicer-looking" but
keyboard-hostile interaction.

## Assumptions

- A single `page` + `section` Contentful content type pair is sufficient
  to model the brief's `Page`/`Section` types (documented in the README).
- "Idempotent publish" means *no new version is created* for an unchanged
  draft, not that the endpoint is safe to call concurrently — see
  concurrency note below.
- Role identity can reasonably be simulated via a signed-in-the-loop
  cookie for this exercise, provided the enforcement boundary is where a
  real auth integration would slot in without changing shape.

## What is not included and why

See the README's "What is incomplete and why" section for the full list;
in short: deep prop editing is scoped to Hero/CTA per the brief, auth is a
dev cookie switcher rather than a real IdP, there's no optimistic
concurrency control on concurrent publishes, and there's no
rollback/unpublish UI — release snapshots are append-only and readable by
version, but re-promoting an old version isn't wired up. These were cut to
keep the implemented surface (schema validation, registry, adapter, Redux
studio, RBAC, SemVer publish, a11y-gated CI) fully correct and tested
rather than spreading effort thinly across a larger, shakier surface.

## Architecture, Redux, Contentful, publish/SemVer, accessibility

These are covered in depth in `README.md` sections 1–6 to avoid duplicating
the same content in two places; this write-up focuses on the *reasoning*
behind those choices rather than restating their mechanics.
