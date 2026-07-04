# Page Studio

A schema-driven landing page studio: load pages from Contentful, edit them in
a lightweight Redux-backed studio, preview them live, and publish immutable,
SemVer'd releases — with RBAC, accessibility, and CI enforcement built in.

## Quick start

```bash
npm install
cp .env.example .env.local   # CONTENT_SOURCE=mock works with zero setup
npm run dev
```

Open `http://localhost:3000`. Use the role switcher on the home page to try
`viewer` / `editor` / `publisher` — it sets an httpOnly cookie that
`middleware.ts` and `/api/publish` check server-side.

- `/preview/home` — rendered page (mock or Contentful)
- `/preview/broken` — demonstrates unknown-type and invalid-prop sections
  falling back gracefully instead of crashing
- `/studio/home` — editor (requires `editor` role or higher)

Run tests:

```bash
npm run test        # unit: schema + SemVer
npm run test:e2e     # Playwright smoke + axe accessibility
npm run typecheck
npm run lint
```

### Using real Contentful instead of mock data

1. **Create a space** at contentful.com and note its **Space ID**
   (Settings → General settings).
2. **Get API keys**: Settings → API keys → Add API key. Copy the
   **Content Delivery API** access token and the **Content Preview API**
   access token.
3. **Get a Content Management token** (used only for the one-time setup
   script below, never by the running app): Settings → API keys →
   Content management tokens → Generate personal token.
4. Fill in `.env.local`:
   ```bash
   CONTENTFUL_SPACE_ID=your_space_id
   CONTENTFUL_ENVIRONMENT=master
   CONTENTFUL_DELIVERY_TOKEN=your_delivery_token
   CONTENTFUL_PREVIEW_TOKEN=your_preview_token
   CONTENTFUL_MANAGEMENT_TOKEN=your_management_token
   CONTENT_SOURCE=contentful
   ```
5. **Create the content model + seed a sample page** — this creates the
   `page` and `section` content types with exactly the field IDs
   `contentfulAdapter.ts` expects, and seeds the same "home" page content
   used in mock mode, so switching sources is a no-op visually:
   ```bash
   npm run contentful:setup
   ```
   The script is idempotent — safe to re-run; it skips anything that
   already exists.
6. Restart `npm run dev` and open `/preview/home` — it now renders from
   real Contentful. `CONTENTFUL_MANAGEMENT_TOKEN` is only needed for step
   5 and can be removed from `.env.local` afterward.

To edit content directly in Contentful: open the `home` entry in the
Contentful web app, edit the linked `section` entries' `props` JSON field
(or add new `section` entries and link them into `page.sections`), then
publish. `/preview/home?draft=true` reads via the Preview API and will
show unpublished changes; `/preview/home` (no query param) only shows
published content, per the Delivery vs Preview split in
`contentfulClient.ts`.

---

## 1. Architecture overview

```
src/
  lib/
    schema.ts            # Zod schemas + per-section prop validation
    sectionRegistry.tsx   # type -> component map (single source of truth)
    contentfulClient.ts   # raw Contentful SDK wrapper (env-driven)
    contentfulAdapter.ts  # Contentful -> Page mapping + validation choke point
    mockContentfulData.ts # offline fixtures used when CONTENT_SOURCE=mock
    semver.ts             # deterministic diff -> bump logic
    releases.ts           # immutable snapshot persistence (releases/<slug>/<version>.json)
    rbac.ts               # role model + server-side role read
  middleware.ts            # edge-level RBAC enforcement (the real boundary)
  app/
    preview/[slug]/page.tsx  # renders a page via PageRenderer
    studio/[slug]/page.tsx   # loads draft, hands off to StudioClient
    api/publish/route.ts     # protected publish endpoint (double-checks role)
    api/dev-login/route.ts   # dev-only role switcher (sets cookie)
    api/whoami/route.ts      # UI-only role read (not a security boundary)
  components/
    PageRenderer.tsx         # walks sections, validates, renders or falls back
    sections/                # Hero, FeatureGrid, Testimonial, Cta, UnsupportedSection
    studio/                  # SectionList, AddSectionPanel, SectionEditor, PublishPanel
  store/                     # Redux Toolkit slices + provider
tests/
  unit/                      # Vitest: schema + SemVer
  e2e/                       # Playwright: smoke + axe
```

**Data flow for preview:** `contentfulAdapter.fetchPageBySlug` → validates
with `safeParsePage` → returns a discriminated `PageFetchResult` → the route
renders either `PageRenderer` or a friendly error state. The route and every
UI component only ever see the app's `Page` type, never a raw Contentful
entry — Contentful-specific logic never leaks past the adapter.

**Data flow for editing:** `StudioClient` loads the fetched page into the
`draftPage` Redux slice (preferring a localStorage-persisted draft if one
exists for that slug). Every subsequent mutation — add/remove/reorder
section, edit props — goes through slice reducers. `PageRenderer` re-renders
from the live Redux state, so the preview pane is the actual draft, not a
separate representation.

**Data flow for publishing:** `PublishPanel` dispatches the `publishPage`
thunk → `POST /api/publish` → role check → `safeParsePage` on the payload →
`releases.publishDraft` diffs against the latest snapshot via
`semver.diffPages`, computes a bump, and writes an immutable
`releases/<slug>/<version>.json` file (never overwritten).

## 2. Redux slice responsibilities

| Slice | Owns | Notes |
|---|---|---|
| `draftPage` | The `Page` being edited: sections, props, dirty flag | Only place page content is mutated. `hydrateFromStorage` restores a reload-safe draft. |
| `ui` | Transient editor chrome: selected section id, panel open state | Deliberately has zero knowledge of page content, so selection changes don't churn draft history. |
| `publish` | Async publish request lifecycle (`idle/loading/succeeded/failed/no-op`), last snapshot/changelog, last error | Talks to `/api/publish` via a `createAsyncThunk`; the draft slice never makes network calls. |

A small `persistDraftMiddleware` in `store.ts` writes the current draft to
`localStorage` (keyed by slug) after every action, which is what makes the
studio reload-safe without needing a slice-specific effect in every
component.

## 3. Contentful model + adapter

Expected Contentful content model (for real, non-mock use):

- **`page`** content type: `pageId` (Short text), `slug` (Short text,
  unique), `title` (Short text), `sections` (References, many, to `section`)
- **`section`** content type: `sectionId` (Short text), `sectionType`
  (Short text — one of `hero`/`featureGrid`/`testimonial`/`cta`), `props`
  (JSON object)

`contentfulClient.ts` is the only file that imports the `contentful` SDK or
reads Contentful env vars, and it exposes two memoized clients — Delivery
(published) and Preview (draft) — selected by a `preview: boolean` flag.

`contentfulAdapter.ts` is the only file the rest of the app calls for page
data. It:

1. Checks `CONTENT_SOURCE` — if `mock`, serves `mockContentfulData.ts`
   fixtures (so the whole app runs with zero Contentful credentials).
2. Otherwise calls the appropriate client, maps the raw entry into the
   app's `Page` shape, and runs it through `safeParsePage`.
3. Returns a discriminated result (`ok: true/false` with a typed error
   reason) — it never throws, and it never returns unvalidated data.

Switching between draft and published content, or between mock and real
Contentful, only ever touches this adapter and its `preview` boolean — no
UI or route code branches on content source.

## 4. Publish + SemVer logic

Rules (from the sprint brief, implemented in `lib/semver.ts`):

- **patch** — an existing section's prop *value* changed (text edits)
- **minor** — a section was added, or a new optional prop key appeared
- **major** — a section was removed, a section's `type` changed, or a
  previously-present prop key was removed (treated as a breaking/required
  change)

`diffPages` compares the latest release snapshot to the current draft
section-by-section (matched by stable `id`), collects every change with its
own bump level, and returns the *highest* bump across all changes.
`nextVersion` applies that bump with `semver.inc`, starting new pages at
`0.1.0`.

Publishing is **idempotent**: if the draft is unchanged since the last
release (`diffPages` returns a `null` bump), `publishDraft` returns a
`no-op` result instead of writing a new file — "same draft ≠ new version."
Snapshots are also protected against accidental overwrite: `publishDraft`
throws rather than clobber an existing `releases/<slug>/<version>.json`.

## 5. RBAC

Three additive roles: `viewer < editor < publisher`. The actual boundary is
server-side:

- `middleware.ts` runs at the edge on every request to `/studio/*` and
  `/api/publish/*`, reads the role cookie directly off the request, and
  redirects/403s before any route code runs.
- `/api/publish` independently re-checks the role from `getCurrentRole()` —
  defense in depth in case the middleware matcher ever drifts.
- The UI (role switcher, disabled Publish button) reflects role via
  `/api/whoami`, but that endpoint is explicitly documented as **not** a
  security boundary — it exists purely so the UI can be honest about what
  a viewer/editor can't do.

This repo ships a `dev-login` cookie-based role switcher instead of a real
identity provider — see "What is incomplete" below.

## 6. Accessibility evidence (WCAG 2.2 AAA-oriented)

- Full keyboard operability: section reordering is exposed as explicit
  "Move up / Move down" buttons (not drag-and-drop only), all interactive
  elements are real `<button>`/`<a>` elements, and a skip link
  (`.skip-link` in `globals.css`) jumps past the role switcher to main
  content.
- Visible focus states are enforced globally via `:focus-visible` in
  `globals.css`, not left to browser defaults, and reinforced per-component
  with `focus-visible:outline` Tailwind utilities.
- Heading hierarchy: each preview has exactly one `<h1>` (page title, or the
  Hero heading), with `<h2>`s for section headings (`FeatureGrid`,
  `AddSectionPanel`, etc.) — never skipped levels.
- `prefers-reduced-motion` is respected globally (`globals.css` collapses
  all animation/transition durations).
- Forms in the studio (`SectionEditor`) use `<Label htmlFor>`,
  `aria-describedby` hints, and visible required-field messaging.
- Colors in `globals.css` were chosen/darkened for high contrast
  (`--primary`, `--destructive`) targeting AAA-level contrast ratios on
  white backgrounds.
- Enforcement: `tests/e2e/a11y.spec.ts` runs `@axe-core/playwright` against
  `/`, `/preview/home`, and `/preview/broken` tagged against
  `wcag2a/aa/aaa` and `wcag21aa`/`wcag22aa` rule sets, writes a consolidated
  `a11y-report.json`, and CI (`.github/workflows/ci.yml`) fails the build if
  any violation has `impact: critical` or `serious`.

## 7. What is incomplete and why

Scoped out to keep this a focused, correct slice rather than a shallow
implementation of everything:

- **Prop editing is limited to Hero text and CTA label/URL**, exactly as
  specified. `FeatureGrid`/`Testimonial` are addable, reorderable, and
  removable, but their props aren't deep-editable in the studio UI yet —
  the schema and renderer already fully support them, so this is a UI-only
  gap (`SectionEditor.tsx` has a clear extension point per section type).
- **Auth is a dev-only cookie switcher**, not a real identity provider. The
  RBAC *enforcement* boundary (middleware + server-side route checks) is
  real and would not need to change if swapped for NextAuth/Clerk/SSO —
  only `getCurrentRole()`'s implementation would.
- **No optimistic concurrency control on publish** — if two publishers
  raced, the second `publishDraft` call would diff against a version that
  might have just changed. For a real multi-editor product this needs a
  version check/lock; out of scope for this sprint.
- **Section drag-and-drop is intentionally not implemented** in favor of
  keyboard-operable up/down controls, per the AAA keyboard-operability
  requirement — see accessibility notes above.
- **Rollback/unpublish** isn't implemented; releases are append-only
  snapshots. Reading an older version (`getRelease`) is supported, but
  there's no UI to "re-publish" an old version as current.
- **Contentful webhooks / ISR revalidation** aren't wired up — `preview`
  routes are `force-dynamic` for simplicity; a production setup would use
  on-demand revalidation triggered by Contentful publish webhooks.

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import it in Vercel; framework preset auto-detects Next.js.
3. Set environment variables (`CONTENTFUL_SPACE_ID`,
   `CONTENTFUL_ENVIRONMENT`, `CONTENTFUL_DELIVERY_TOKEN`,
   `CONTENTFUL_PREVIEW_TOKEN`, `CONTENT_SOURCE=contentful`) in Vercel
   project settings, or leave `CONTENT_SOURCE=mock` to demo without a real
   space.
4. Deploy. `releases/` snapshot files are written to the serverless
   filesystem, which is ephemeral on Vercel — for a real deployment, swap
   `lib/releases.ts`'s `fs` calls for a persistent store (S3, a database,
   or Contentful itself as the release store); the function signatures are
   already isolated to that one file.
