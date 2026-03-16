# Watchlist — Compare Letterboxd Watchlists

A personal, local-only web app to compare Letterboxd watchlists across friends and find films to watch together.

- Browse all films on your friends' watchlists, grouped by how many people want to watch them
- Filter by genre, sort by rating, runtime, or title
- Fade out films you've already watched
- Movie posters, ratings, runtime, and director via TMDB (optional)

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

### 3. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Docker

### Run with Docker

```bash
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
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

```yaml
services:
  watchlist:
    image: dswwilliams/compare-letterboxd-watchlists
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

> Data is persisted in the mounted `data/` volume. All friend data, watched films, and settings are stored there.

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

## Credits

Letterboxd scraping is powered by [letterboxdpy](https://github.com/fastfingertips/letterboxdpy) by [@fastfingertips](https://github.com/fastfingertips).

---

## Docker Hub

[dswwilliams/compare-letterboxd-watchlists](https://hub.docker.com/r/dswwilliams/compare-letterboxd-watchlists)

---

## License

MIT
