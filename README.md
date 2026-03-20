# Watchlist — Compare Letterboxd Watchlists

A personal, local-only web app to compare Letterboxd watchlists across friends and find films to watch together.

- Browse all films on your friends' watchlists, grouped by how many people want to watch them
- Import Letterboxd lists and see which films on the list are on your friends' watchlists
- Filter by genre, sort by rating, runtime, or title
- Fade or hide films you've already watched
- Highlights each friend's top-4 favourite films with a gold border
- Set custom display names for friends
- Movie posters, ratings, runtime, and director via TMDB (requires a free API key — see setup)

---

## Requirements

- [Node.js](https://nodejs.org/) 18 or later
- [Python](https://www.python.org/) 3.10 or later
- macOS, Linux, or Windows (WSL recommended on Windows)

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/dsw-williams/compare-letterboxd-watchlists
cd compare-letterboxd-watchlists
```

### 2. Install dependencies

```bash
npm install
pip3 install -r requirements.txt
```

> **macOS note:** If your system Python is older than 3.10, install a newer version (e.g. via Homebrew: `brew install python3`) and set the `PYTHON_EXECUTABLE` env var in `.env.local`:
> ```
> PYTHON_EXECUTABLE=python3.14
> ```

### 3. Add your TMDB API key

Copy the example env file and add your key:

```bash
cp .env.example .env.local
```

Then open `.env.local` and replace `your_tmdb_api_key_here` with your actual key. Get a free key at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).

> The app runs without a TMDB key but movie posters, ratings, runtime, and director info will be missing.

### 4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Docker

### Run with Docker

First, set up your env file:

```bash
cp .env.example .env
# Edit .env and add your TMDB API key
```

Then run:

```bash
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --env-file .env \
  --name watchlist \
  dswwilliams/compare-letterboxd-watchlists
```

Open [http://localhost:3000](http://localhost:3000)

### Build the image yourself

```bash
docker build -t compare-letterboxd-watchlists .
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --name watchlist \
  compare-letterboxd-watchlists
```

### Docker Compose

A `docker-compose.yml` is included. Set up your env file first:

```bash
cp .env.example .env
# Edit .env and add your TMDB API key
```

Then:

```bash
docker compose up -d
```

> Data is persisted in the mounted `data/` volume. All friend data, watched films, and settings are stored there.

---

## Usage

1. Open the app and follow the onboarding to add yourself and friends by Letterboxd username
2. Optionally select curated Letterboxd lists to import during onboarding
3. On the home page, select friends to compare watchlists and browse shared films
4. Go to **Settings** (gear icon) to add more friends, import lists, rename or sync existing ones

---

## Notes

- All data is stored locally in a `data/` folder — nothing ever leaves your machine
- The **sync button** (↻) on the Settings page quickly picks up recent watched activity, refreshes the watchlist, and updates favourite films
- Re-sync a friend after adding a TMDB key to populate their posters, ratings, and runtime data
- The TMDB API key is set via environment variable only (see setup above) — it cannot be changed in the UI

---

## Credits

Letterboxd scraping is powered by [letterboxdpy](https://github.com/fastfingertips/letterboxdpy) by [@fastfingertips](https://github.com/fastfingertips).

---

## Docker Hub

[dswwilliams/compare-letterboxd-watchlists](https://hub.docker.com/r/dswwilliams/compare-letterboxd-watchlists)

---

## License

MIT
