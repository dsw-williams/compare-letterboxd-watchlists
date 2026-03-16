# compare-letterboxd-watchlists — Claude Code Build Spec

## What You're Building

A personal, local-only web app to compare Letterboxd watchlists across friends and find films to watch together.

- **No user accounts or auth** — single-user personal tool
- **No external database** — data stored in local JSON files
- **Free and open source** — all dependencies must be free/open source
- **Runs locally** — `npm run dev` on localhost:3000
- **Two pages only** — Home and Settings

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **HTML parsing:** `cheerio` (MIT)
- **XML parsing:** `fast-xml-parser` (MIT)
- **Data storage:** JSON files in `/data/` directory (gitignored)
- **External APIs:**
  - Letterboxd HTML scraping + RSS (no auth)
  - TMDB API (free tier — key stored in `data/settings.json`, entered via Settings UI)

---

## Project Structure

```
compare-letterboxd-watchlists/
├── CLAUDE.md
├── README.md
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── data/
│   ├── friends.json
│   └── settings.json
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                        # Home page
│   │   ├── settings/
│   │   │   └── page.tsx                    # Settings page
│   │   └── api/
│   │       ├── friends/
│   │       │   ├── route.ts                # GET all, POST add
│   │       │   └── [username]/
│   │       │       ├── route.ts            # DELETE
│   │       │       ├── sync/
│   │       │       │   └── route.ts        # POST full sync
│   │       │       └── sync-rss/
│   │       │           └── route.ts        # POST incremental RSS sync
│   │       ├── overlap/
│   │       │   └── route.ts                # GET overlapping films
│   │       └── settings/
│   │           └── route.ts                # GET + POST settings
│   ├── components/
│   │   ├── Nav.tsx
│   │   ├── FriendSelector.tsx
│   │   ├── MovieCard.tsx
│   │   ├── MovieGrid.tsx
│   │   └── AddFriendForm.tsx
│   └── lib/
│       ├── storage.ts
│       ├── letterboxd.ts
│       ├── tmdb.ts
│       └── types.ts
```

---

## Data Types (`src/lib/types.ts`)

```typescript
export interface Movie {
  title: string;
  year: string;
  slug: string;               // e.g. "sinners-2025"
  director: string | null;
  poster_url: string | null;  // TMDB poster URL
  letterboxd_url: string;
  tmdb_id: number | null;
  genres: string[];
  rating: number | null;      // TMDB vote_average out of 10
}

export interface Friend {
  username: string;           // Letterboxd username (unique key)
  full_name: string | null;   // Display name e.g. "Dylan"
  avatar_url: string | null;
  watchlist: Movie[];
  watched: Movie[];
  last_synced: string | null; // ISO date string
}

export interface Settings {
  tmdb_api_key: string | null;
}
```

---

## Data Storage (`src/lib/storage.ts`)

Read/write JSON files. Create files with defaults if they don't exist.

```typescript
export async function getFriends(): Promise<Friend[]>
export async function getFriend(username: string): Promise<Friend | null>
export async function upsertFriend(friend: Friend): Promise<void>
export async function deleteFriend(username: string): Promise<void>
export async function getSettings(): Promise<Settings>
export async function saveSettings(settings: Settings): Promise<void>
```

Defaults — `friends.json`: `{ "friends": [] }` | `settings.json`: `{ "tmdb_api_key": null }`

---

## Letterboxd Integration (`src/lib/letterboxd.ts`)

Use `cheerio` for HTML, `fast-xml-parser` for RSS.

> **Always include this header on every request:**
> `'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'`

### 1. Full Watched Scrape — `fetchAllWatched(username)`

URL: `https://letterboxd.com/{username}/films/page/{n}/`

Parse each `li.poster-container > div.film-poster` for:
- `data-film-slug` → slug + build `letterboxd_url`
- `data-film-name` → title
- `data-film-year` → year

Paginate until page has no `.poster-container` items. Add 500ms delay between pages.

### 2. RSS Sync — `fetchWatchedViaRSS(username)`

URL: `https://letterboxd.com/{username}/rss/`

Parse with `fast-xml-parser`. Extract `<letterboxd:filmTitle>`, `<letterboxd:filmYear>`, `<link>` (derive slug from URL). Returns `Movie[]` for merging.

### 3. Watchlist Scrape — `fetchWatchlist(username)`

URL: `https://letterboxd.com/{username}/watchlist/page/{n}/`

Same structure and pagination as watched. Full re-scrape every sync.

### 4. Profile Info — `fetchProfileInfo(username)`

URL: `https://letterboxd.com/{username}/`

Parse display name (`$('.profile-name .name').text()`) and avatar (`$('.avatar img').attr('src')`).

### Sync Strategy

| Situation | Action |
|---|---|
| Friend first added | `fetchProfileInfo` + `fetchAllWatched` + `fetchWatchlist` |
| Subsequent sync | `fetchWatchedViaRSS` (merge) + `fetchWatchlist` (full replace) |

RSS merge: deduplicate by `slug`. New entries prepended to existing watched array.

---

## TMDB Integration (`src/lib/tmdb.ts`)

Key from `settings.json`. If not set, skip enrichment silently.

Search: `GET https://api.themoviedb.org/3/search/movie?query={title}&year={year}&api_key={key}`

Enrich with: `poster_url` (w342), `genres[]`, `rating` (vote_average), `tmdb_id`. 25ms delay between requests.

```typescript
export async function enrichMovies(movies: Movie[], apiKey: string): Promise<Movie[]>
```

---

## API Routes

### `GET /api/friends` → `Friend[]`

### `POST /api/friends`
Body: `{ username: string }`. Validates, checks for duplicate (409), fetches profile, runs full scrape, enriches with TMDB, saves. Returns `Friend`.

### `DELETE /api/friends/[username]` → `{ success: true }`

### `POST /api/friends/[username]/sync`
Full re-scrape + TMDB enrich. Returns updated `Friend`.

### `POST /api/friends/[username]/sync-rss`
RSS merge + watchlist re-scrape + TMDB enrich new items only. Returns updated `Friend`.

### `GET /api/overlap?usernames=alice,bob`
Returns `Array<{ movie: Movie; friends: string[] }>` — films on 2+ selected friends' watchlists. Sort: friend count desc, then rating desc.

### `GET /api/settings` → `Settings`
### `POST /api/settings` body `Settings` → `Settings`

---

## UI — EXACT RECREATION FROM SCREENSHOTS

> **Before writing any UI code, open and study these two image files:**
> - `docs/screenshot-home.png` — the home page
> - `docs/screenshot-settings.png` — the settings page
>
> Implement the UI exactly as shown in those screenshots. Every spacing, colour, component, and layout detail below is taken directly from them. Refer back to the images whenever making any visual decision.

---

### Design Philosophy — Letterboxd Brand Extension

The app should feel like a natural extension of Letterboxd's own visual identity — as if it were an official Letterboxd feature rather than a third-party tool. Study letterboxd.com carefully and match their aesthetic precisely:

- **Typography:** Letterboxd uses a clean, slightly condensed sans-serif. Use `'Graphik', 'Arial Narrow', system-ui, sans-serif` as the font stack. Headings are bold and tight. Body text is compact and efficient.
- **Colour palette:** Letterboxd's signature green (`#00c030`) is used sparingly as the sole accent — on buttons, active states, links, and badges. Everything else is desaturated dark greys and near-blacks. Never use blue, purple, or other accent colours.
- **Texture:** Letterboxd uses very subtle card elevation — cards are barely distinguishable from the background, separated mainly by thin low-contrast borders rather than heavy shadows. Avoid drop shadows; prefer border-based separation.
- **Imagery:** Movie poster art does all the visual heavy lifting. The UI chrome stays minimal and dark so the posters pop. Never add decorative backgrounds or gradients to non-poster areas.
- **Interaction:** Hover states are subtle — slight brightness increase or thin green border highlight, never flashy. Transitions are fast (150ms).
- **Density:** Letterboxd favours information density — compact metadata (year, director, rating) below posters, small type, tight spacing. Don't add padding generously; keep it tight.
- **Icons:** Use simple, minimal line icons. Letterboxd uses thin-stroke iconography. No filled/chunky icons.
- **Buttons:** The primary action button (Import, green) is full-width in its context, solid green fill, white text, no border-radius extremes — `rounded-md` not `rounded-full`. Secondary actions are ghost/icon-only.
- **Overall feel:** Dark, cinematic, editorial — like a well-designed film magazine printed on black paper.

---

### Global Design Tokens

```css
--bg-primary: #141414;         /* Page background — very dark near-black */
--bg-card: #1e2128;            /* Card/panel background — dark grey-blue */
--bg-card-hover: #252830;      /* Card hover state */
--border: #2a2d35;             /* Subtle borders */
--text-primary: #ffffff;       /* White headings */
--text-secondary: #9ba3af;     /* Muted grey for subtitles, metadata */
--text-tertiary: #6b7280;      /* Even more muted — timestamps */
--accent-green: #00c030;       /* Letterboxd green — buttons, active states, logo bg */
--accent-green-hover: #00a828;
--accent-orange: #f97316;      /* Badge "2/3" overlap count */
--star-yellow: #f59e0b;        /* Star rating colour */
--font: system-ui, -apple-system, sans-serif;
```

---

### Nav (`src/components/Nav.tsx`)

**Exact layout from screenshots:**

```
[ 🎬 WATCHLIST ]                                              [ ⚙ ]
```

- Full-width, very dark background (`--bg-primary`), thin bottom border (`--border`)
- Left side: green square logo icon (🎬 or film icon, `--accent-green` background, white icon, ~28×28px rounded) + "WATCHLIST" text in white, bold, uppercase, tracked
- Right side: gear icon button (⚙), outlined square style, ~36×36px, `--bg-card` background, `--border` border, rounded-md
- Gear icon links to `/settings`
- Height: ~48px. Padding: horizontal 24px.

---

### Home Page (`src/app/page.tsx`)

**Reference: Screenshot 1**

#### Page header

```
Who's watching tonight?
Select friends to compare watchlists.
```

- "Who's watching tonight?" — large bold white heading, ~28px
- Subtitle — muted grey (`--text-secondary`), ~14px
- Top margin from nav: ~32px

#### Friends Panel

A rounded panel (`--bg-card`, `--border` border, rounded-xl, padding 20px):

**Panel header:**
```
FRIENDS                                               Select all
```
- "FRIENDS" — tiny uppercase muted label (`--text-tertiary`), ~11px letter-spacing
- "Select all" — green text link (`--accent-green`), right-aligned, ~13px

**Friend avatars row:**

Horizontal row of friend avatar items, evenly spaced, left-aligned with gap.

Each friend item:
- Circular avatar image, ~56px diameter
- **Selected state:** green checkmark badge overlaid bottom-right of avatar (green filled circle with white ✓, ~18px). Green ring/border around the avatar circle.
- **Unselected state:** no badge, no ring
- Username text below avatar, ~12px, `--text-secondary`, centred, truncated if long

The row wraps if needed. First two friends (cgdiaz, cwherrett) are shown selected with green checkmarks in the screenshot.

#### Genre Filter Chips

Below the friends panel, a wrapping row of pill/chip buttons:

- **Active chip** ("All"): green filled background (`--accent-green`), white text, rounded-full, px-3 py-1, ~13px
- **Inactive chips**: transparent background, `--border` border, `--text-secondary` text, rounded-full, px-3 py-1, ~13px, hover: slightly brighter border

Genres shown: All, Action, Adventure, Animation, Comedy, Crime, Documentary, Drama, Family, Fantasy, History, Horror, Music, Mystery, Romance, Science Fiction, TV Movie, Thriller, War, Western

These chips are populated dynamically from the genres present in the overlap results.

#### Results header

```
100 films found    14 shared                         Fade watched  ○——●
```

- "100 films found" — white bold, ~16px
- "14 shared" — green text (`--accent-green`), ~14px, separated by space
- Right side: "Fade watched" label in `--text-secondary` + a toggle switch (dark pill shape, green when on). When enabled, cards for films already watched by selected friends get reduced opacity (~40%).
- Count updates dynamically based on selected friends + active genre filter.

#### Section heading

```
ON MULTIPLE WATCHLISTS
```

Small uppercase muted label, ~11px, `--text-tertiary`, letter-spacing.

#### Movie Grid

Responsive grid. Cards are approximately 185px wide. Gap ~12px. As many columns as fit.

---

### Movie Card (`src/components/MovieCard.tsx`)

**Reference: Screenshot 1, the film cards**

```
┌──────────────────────────────┐
│  ★★★★  [orange badge: 2/3]  │  ← overlaid top of poster
│                              │
│         POSTER               │
│         IMAGE                │
│                              │
│  [avatar] [avatar]           │  ← overlaid bottom-left of poster
└──────────────────────────────┘
Title of the Film
Year · Director Name
```

**Poster area:**
- Fixed width ~185px, height ~278px (2:3 ratio), `rounded-lg`, `overflow-hidden`
- Actual TMDB poster image fills the area, `object-cover`
- No poster → dark placeholder (`--bg-card`) with film title centred in `--text-secondary`

**Star rating badge** (top-left overlay on poster):
- Dark semi-transparent pill, ~`bg-black/60`, rounded-full, px-2 py-0.5
- Yellow stars (filled ★ characters), ~12px. Show rating as stars out of 5 (divide TMDB rating by 2).
- If no rating: omit badge

**Overlap count badge** (top-right overlay on poster):
- Orange filled rounded pill (`--accent-orange`), white text, bold, ~12px
- Shows "2/3" format — number of selected friends who have it on their watchlist / total selected friends
- Always shown when card is in overlap view

**Friend avatar overlaps** (bottom-left overlay on poster):
- Small circular avatars (~20px) of the friends who have this film on their watchlist
- Overlapping stack (each offset ~12px right), with a subtle dark ring border
- Show max 3, then "+N" if more

**Below the poster (no card background — text sits directly on page background):**
- Film title: white, bold, ~14px, max 2 lines, truncated with ellipsis
- Year · Director: `--text-secondary`, ~12px, truncated

**Hover state:** `scale(1.03)` transform, `transition-transform duration-150`

**Click:** opens `letterboxd_url` in new tab

**Faded state** (when "Fade watched" is on and film is in a selected friend's watched list): `opacity-40`

---

### Settings Page (`src/app/settings/page.tsx`)

**Reference: Screenshot 2**

#### Page header

```
Settings
```

Centred heading, white, bold, ~24px. Top margin ~40px.

#### Add a person panel

Centred, max-width ~500px, `--bg-card` background, `--border` border, rounded-xl, padding 24px.

```
Add a person
Enter their Letterboxd username exactly as it appears on their profile
page at letterboxd.com/username

[ letterboxd.com/  username                          ]

[  ⭐ Import                                         ]
```

- Panel heading: "Add a person", white, bold, ~16px
- Description: `--text-secondary`, ~13px
- Input field: dark background (`#0d0f12` or similar), `--border` border, rounded-lg, full width, ~44px height. Left prefix text "letterboxd.com/ " in `--text-tertiary` inside the input as a visual prefix. Placeholder "username" in `--text-tertiary`.
- "Import" button: full-width, `--accent-green` background, white text, bold, ~44px height, rounded-lg. Star/sparkle icon ✦ left of text. On hover: `--accent-green-hover`.

#### Friend list

Below the add panel, centred, max-width ~500px. Each friend is a row card:

```
┌──────────────────────────────────────────────────────────────┐
│ [avatar]  DisplayName          [↻ icon]  [🗑 icon]          │
│           @username                                           │
│           🎬 233 to watch  ·  291 watched  ·                 │
│           synced about 17 hours ago                          │
└──────────────────────────────────────────────────────────────┘
```

- Card: `--bg-card`, `--border` border, rounded-xl, padding 16px 20px, full width
- Avatar: circular, ~48px, with a thin `--border` ring
- **Display name** (full_name if available, else username): white, bold, ~15px
- **@username**: `--text-secondary`, ~13px
- **Stats row**: small film icon (🎬 or similar) + "{N} to watch" · "{N} watched" · — all `--text-secondary`, ~13px
- **Synced timestamp**: "synced about X hours ago" — `--text-tertiary`, ~12px
- Right side icons (right-aligned, vertically centred):
  - Refresh/sync icon (↻): `--text-secondary`, ~20px, rounded button on hover, triggers incremental RSS sync
  - Trash/delete icon (🗑): `--text-secondary`, ~20px, rounded button on hover, triggers remove with confirmation
- Gap between cards: ~8px

**Loading state for import:** When adding a friend, show progress steps inline below the Import button:
- "Fetching profile..."
- "Scraping watched films (page N of ?)..."
- "Scraping watchlist..."
- "Enriching with TMDB..."

Show each step as it completes. On error, show error message in red.

---

## Edge Cases & Behaviour

- **Private / not found profiles:** Show clear error inline — "Profile not found or is private"
- **No TMDB key:** App works fully. Movie cards show no poster (dark placeholder) and no rating badge.
- **"Select all" link:** Selects all friends at once
- **Genre filter:** "All" shows everything. Clicking a genre filters overlap results client-side.
- **Fade watched toggle:** When on, any film in the `watched` array of any selected friend gets `opacity-40` in the grid.
- **Relative timestamps:** "just now" / "5 minutes ago" / "2 hours ago" / "3 days ago"
- **Large watchlists:** 500ms delay between page requests during full scrape. Show page count progress during add.
- **Overlap count:** "X films found · Y shared" — "found" = total after genre filter, "shared" = films on 2+ watchlists.

---

## package.json

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "cheerio": "^1.0.0",
    "fast-xml-parser": "^4.3.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## .gitignore

```
data/
.env
.env.local
.DS_Store
node_modules/
.next/
```

---

## README.md

1. Compare Letterboxd watchlists with friends to find films to watch together
2. Prerequisites: Node.js 18+
3. Setup:
   ```bash
   git clone https://github.com/YOUR_USERNAME/compare-letterboxd-watchlists
   cd compare-letterboxd-watchlists
   npm install
   npm run dev
   ```
4. Open http://localhost:3000
5. Go to Settings (gear icon) → add friends by Letterboxd username
6. Optionally add a free TMDB API key (themoviedb.org/settings/api) for posters + ratings
7. Select friends on home page to compare watchlists
8. Data stored locally in `data/` — never leaves your machine
9. License: MIT

---

## Build Order

0. **Read the screenshots** — Open `docs/screenshot-home.png` and `docs/screenshot-settings.png` and study them before writing any code. Return to them before implementing each page.
1. **Scaffold** — `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `.gitignore`, `README.md`
2. **Types** — `src/lib/types.ts`
3. **Storage** — `src/lib/storage.ts` + initialise `data/` files
4. **Letterboxd lib** — `src/lib/letterboxd.ts`
5. **TMDB lib** — `src/lib/tmdb.ts`
6. **API routes** — all routes
7. **Global styles + Tailwind config** — set up design tokens as CSS variables, configure dark mode
8. **Layout + Nav** — `layout.tsx`, `Nav.tsx`
9. **Settings page** — full implementation per screenshot 2
10. **Home page components** — `FriendSelector`, `MovieCard`, `MovieGrid`
11. **Home page** — full implementation per screenshot 1
12. **Polish** — loading skeletons, error states, empty states, responsive, transitions