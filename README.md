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

## Docker (alternative setup)

If you'd rather not install Node.js locally — or want to run this on a NAS or home server — you can use Docker instead.

### Requirements

- [Docker](https://www.docker.com/) with Docker Compose

### Run

```bash
git clone https://github.com/dsw-williams/compare-letterboxd-watchlists
cd compare-letterboxd-watchlists
mkdir -p data
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000)

Your data is stored in the `data/` folder next to `docker-compose.yml` and persists across restarts.

To run in the background:

```bash
docker compose up --build -d
docker compose logs -f   # view logs
docker compose down      # stop
```

To rebuild after pulling updates:

```bash
git pull
docker compose up --build
```

> **NAS / home server note:** The image supports both `amd64` and `arm64`, so it works on most NAS devices (Synology, Unraid, etc.). Change the port mapping in `docker-compose.yml` if 3000 is already in use (e.g. `"8080:3000"`).

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
