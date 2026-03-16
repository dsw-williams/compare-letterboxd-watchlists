# Watchlist — Compare Letterboxd Watchlists

A personal, local-only web app to compare Letterboxd watchlists across friends and find films to watch together.

- Browse all films on your friends' watchlists, grouped by how many people want to watch them
- Filter by genre, sort by rating, runtime, or title
- Fade out films you've already watched
- Movie posters, ratings, runtime, and director via TMDB (optional)

---

## Requirements

- [Node.js](https://nodejs.org/) 18 or later
- macOS, Linux, or Windows (WSL recommended on Windows)

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/dsw-williams/compare-letterboxd-watchlists
cd compare-letterboxd-watchlists
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install the Playwright browser

This is required for scraping watched films from Letterboxd.

```bash
npx playwright install chromium
```

### 4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---


## Usage

1. Go to **Settings** (gear icon, top right)
2. Add friends by their Letterboxd username
3. Optionally add a free [TMDB API key](https://www.themoviedb.org/settings/api) to enable movie posters, ratings, runtime, and director info
4. Head back to the home page, select friends, and browse your shared watchlists

---

## Notes

- All data is stored locally in a `data/` folder — nothing ever leaves your machine
- The **sync button** (↻) on the Settings page picks up recent watched activity and refreshes the watchlist
- Re-sync a friend after adding a TMDB key to populate their posters, ratings, and runtime data

---

## License

MIT
