# FS25 Interactive Maps — Architecture Reference

This is a reference for anyone (including future-you) picking up this codebase. It covers how the pieces fit together, not just what each file does line-by-line.

## Repos

| Repo | Local path | Live URL |
|---|---|---|
| `FS25Interactive.github.io` | `fs25-maps-hub` | https://fs25interactive.github.io/ |
| `Kinlaig-Map-FS25` | `kinlaig-map` | https://keiranpoly2611.github.io/Kinlaig-Map-FS25/ |
| `Zielonka-Map-FS25` | `zielonka-map` | https://keiranpoly2611.github.io/Zielonka-Map-FS25/ |
| `HutanPantai-Map-FS25` | `hutanpantai-map` | https://keiranpoly2611.github.io/HutanPantai-Map-FS25/ |
| `RiverbendSprings-Map-FS25` | `riverbendsprings-map` | https://keiranpoly2611.github.io/RiverbendSprings-Map-FS25/ |

All 5 repos are independent — no shared build step, no shared package, no monorepo tooling. Each map is a single self-contained `index.html` (map image embedded as base64 WebP, no external JS/CSS dependencies except the Tabler Icons CDN stylesheet). The hub is a separate static page that only links out to the maps; it shares no code or save data with them.

`fs25-maps-hub`'s git remotes:
- `origin` → `https://github.com/FS25Interactive/FS25Interactive.github.io.git` — the real, current hub. Push here.
- `legacy` → `https://github.com/keiranpoly2611/keiranpoly2611.github.io.git` — old personal-account URL. Now serves only a `<meta http-equiv="refresh">` redirect to the new hub. Don't push real hub content here.

## Cloud Sync backend (Supabase)

One shared Supabase project backs Cloud Sync for all 4 maps — no per-map backend to maintain.

- Project ref: `aicyvaqkzqlijffqihzd`, URL: `https://aicyvaqkzqlijffqihzd.supabase.co`
- Anon/publishable key is hardcoded in every map's `index.html` as `SUPABASE_ANON_KEY` (safe to be public — it's gated by RLS + the RPCs below, not a secret)

**Schema** (`supabase_setup.sql` for fresh installs; `supabase_migration_*.sql` files are the incremental deltas actually applied to the live project, in order: `supabase_migration_rooms.sql` → `supabase_migration_create_room.sql` → `supabase_migration_map_terminology.sql`):

```sql
map_saves (
  map_id text not null,       -- 'kinlaig' | 'zielonka' | 'hutanpantai' | 'riverbendsprings'
  room_code text not null default '',  -- '' = a map's default/shared room
  access_code text not null,  -- the "edit code" / password for this room
  data jsonb,                 -- the whole backupObject() blob: {version, exportedAt, mapMode, owners, plans}
  updated_at timestamptz,
  updated_by text,
  primary key (map_id, room_code)
)
```

RLS is enabled with **zero policies** — the anon key cannot read/write the table directly at all. The only access path is three `SECURITY DEFINER` RPC functions, each of which checks `access_code` server-side before touching a row:

- `fs25_load_map(p_map_id, p_code, p_room_code default '')` → `{data, updated_at, updated_by}`. Raises if the code/room combo doesn't match.
- `fs25_save_map(p_map_id, p_code, p_data, p_updated_by, p_room_code default '')` → `{saved_at}`. Requires the room to **already exist** — raises "...create it first" otherwise. Does *not* auto-create.
- `fs25_create_room(p_map_id, p_room_code, p_code, p_created_by default '')` → `{created_at}`. Creates a brand-new room; raises if the room code is blank, the code is blank, or the room already exists.

Room creation is deliberately its own RPC, separate from saving — an earlier version let `fs25_save_map` silently create a room on first upload, which was confusing (a "create" action wasn't its own visible step). Don't merge them back together.

**Default rooms:** each map originally had one `room_code = ''` row seeded with a shared password (`Bubblegum1`). Keiran later renamed his own via a manual `update ... set room_code = 'PolyOffice' where room_code = ''` on all 4 maps — this **moves** the row, so `room_code=''` no longer resolves on any of the 4 maps now. Anyone still leaving Map code blank needs to type `PolyOffice`. Public visitors create their own room via the "Create a new map" UI, independent of Keiran's.

## Client-side structure (per map's `index.html`)

Every map is a copy of the same template (originally Kinlaig's, later maps copied from whichever was most current). Only these differ between maps:
- `markersData` (field/land coordinates, digitized per-map — see "Adding a new map" below)
- The embedded base64 map image
- localStorage key prefix (`kinlaig_fs25_*`, `zielonka_fs25_*`, etc.)
- `CLOUD_MAP_ID` constant
- Page title/heading/share-link text
- Fields-vs-land dual toggle (only Kinlaig has this split; the 3 official maps have one combined "Fields 1–N" group)

Everything else — CSS, tab structure, Guide tab crop/Precision-Farming data, Cloud Sync logic — is generic and identical across all 4.

**Tabs:** Map / Fields / Cloud / Guide.

**Local save data** (`plans`, `owners`, `mapMode`) is namespaced per map code so multiple maps can coexist on one device without clobbering each other:
```js
function localSaveKey(base, room = cloudRoomCode) {
  return base + '::' + (room || 'default');
}
```
A `migrateLegacyLocalSave()` IIFE runs once on page load, copying any pre-existing flat-key save (from before this namespacing existed) into the currently-active room's own slot — this is why nobody lost data when it shipped. `switchToActiveMapLocalSave()` re-reads plans/owners/mapMode from the *target* room's slot and re-renders; it's called at the top of `cloudLoad()` (so the view always matches whatever room you just tried to load, even before the network resolves) and at the end of a successful `createRoom()` (so a freshly-created room shows blank, not leftover data from whatever was on screen).

**Cloud tab** has two cards:
1. **Create a new map** — `newRoomCode` / `newRoomEditCode` / `newRoomCreatorName` inputs, `generateRoomBtn` (fills a random code into `newRoomCode` only), `createRoomBtn` → calls `fs25_create_room`, then auto-fills the sync card's fields and switches the active view to the new (blank) room.
2. **Cloud sync / multiplayer beta** — `cloudRoomCode` / `cloudToken` / `cloudUserName` inputs, Save setup / Load from cloud / Upload current map buttons, auto-upload checkbox. `getCloudRoomCode()`/`getCloudToken()`/`getCloudUserName()` all read the live DOM element's value directly (never falling back to a stored variable when the element exists) — an earlier version used `el?.value || storedVar`, which silently ignored a deliberately-cleared field since empty string is falsy in JS.

**Terminology note:** the UI says "Map code" everywhere (Keiran's preferred wording), but internal ids/variables/the `room_code` column still say "room" — e.g. `cloudRoomCode`, `newRoomCode`, `createRoomBtn`, `fs25_create_room`. This is intentional; don't rename the internals to match unless asked, since it'd be a large diff for a purely cosmetic reason.

**Network:** `supabaseRpc(fn, body)` is a thin wrapper posting to `${SUPABASE_URL}/rest/v1/rpc/${fn}` with `apikey`/`Authorization: Bearer` headers set to the anon key. Plain `fetch()`, no SDK — Supabase's REST gateway has proper CORS, unlike the old Google Apps Script backend this replaced (which needed a JSONP + hidden-iframe-POST fallback; none of that exists anymore).

## Hub (`fs25-maps-hub/index.html`)

A card grid driven by a `maps` array in an inline `<script>` — each entry is `{name, desc, fields, kind, url, thumbGradient}`. Adding a map is just adding an array entry; the grid renders itself. Grid CSS uses **explicit breakpoints** (1 column <560px, 2 columns 560–899px, 4 columns ≥900px) rather than fluid `auto-fit`, specifically so 4 cards are always 2-per-row or a full row — fluid sizing would put 3 per row at some widths, orphaning the 4th.

## Adding a 5th map — the recipe

1. Get a clean numbered field-layout image (PDF or similar) of the official/modded map.
2. Render it with PyMuPDF (`fitz`) at 3x scale — not `pdftoppm`, often unavailable.
3. OpenCV contour detection on the number badges using a **solidity/extent filter** (`contourArea / (w*h) > ~0.72`), not just hole-counting — holeless digits (1, 2, 3, 7) get missed by hole-based filters alone.
4. Generate a contact sheet of candidate crops, read each number visually (vision, not OCR).
5. Programmatic completeness check (all numbers 1..N present exactly once) — flags misses immediately.
6. **Also** render a full-image overlay (colored circle per marker) and visually scan it — completeness alone doesn't catch a coordinate that landed on the wrong badge. Watch for contours broken by roads/railways running through a badge; those need a manual zoomed pixel read.
7. Copy the most-current existing map's `index.html` as the template.
8. Replace: `markersData`, embedded image, localStorage prefix, title/heading/share-link text, `CLOUD_MAP_ID` (new unique value).
9. Standalone GitHub repo + its own Pages site (never a subpath of another map).
10. Add the `hubLink` "← All maps" pill pointing at `https://fs25interactive.github.io/`.
11. In Supabase SQL editor: `insert into map_saves (map_id, room_code, access_code) values ('newmapid', '', 'Bubblegum1');` (or whatever default password makes sense).
12. Add an entry to the hub's `maps` array, push.

## Known gotchas on this machine

- The Bash tool has occasionally hung/timed out partway through a loop of git commands across multiple repos (succeeds on the first 2-3, times out on the rest) — just re-run the remaining ones individually; PowerShell has also worked as a fallback when Bash misbehaves.
- Brand-new local clones have no repo-level `git config user.name`/`user.email` on this machine (no global config set) — set both locally before the first commit in a fresh clone.
- GitHub Pages user/org "clean URL" sites require the repo name to **exactly** match `accountname.github.io` or `orgname.github.io`; there is no way to rename this later short of moving the repo to a differently-named account/org.
- Supabase's dashboard has changed where API keys are labeled/located at least once (`anon public` JWT → `sb_publishable_...` under a differently-named settings page) — if guiding a similar setup again, don't assume the old labels; ask for a screenshot.
