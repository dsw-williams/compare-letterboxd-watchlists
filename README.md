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

If you'd rather not install Node.js locally, you can run the app in Docker. This section covers both a standard Docker setup and a dedicated Unraid guide.

---

### Standard Docker

**Requirements:** [Docker](https://www.docker.com/) with Docker Compose

```bash
git clone https://github.com/dsw-williams/compare-letterboxd-watchlists
cd compare-letterboxd-watchlists
mkdir -p data
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000)

Your data lives in the `data/` folder and persists across restarts.

```bash
docker compose up --build -d   # run in background
docker compose logs -f          # view logs
docker compose down             # stop
```

To rebuild after pulling updates:

```bash
git pull
docker compose up --build
```

---

### Unraid

The container supports PUID/PGID so files written to your appdata share are owned by the correct Unraid user.

#### Step 1 — Install the Compose Manager plugin

In the Unraid web UI go to **Apps** (Community Applications) and search for **"Compose Manager"**. Install it. This adds a **Compose** tab to the Docker page.

#### Step 2 — Copy the source onto Unraid

Open an SSH session (or use the Unraid terminal) and run:

```bash
cd /mnt/user/appdata
git clone https://github.com/dsw-williams/compare-letterboxd-watchlists
cd compare-letterboxd-watchlists
mkdir -p data
```

#### Step 3 — Find your PUID and PGID

In the Unraid terminal, run:

```bash
id
```

Note the `uid=` and `gid=` values. The default Unraid user is typically `uid=99` and `gid=100` (the `nobody` user). Use these values in the next step.

#### Step 4 — Edit docker-compose.yml

Open `/mnt/user/appdata/compare-letterboxd-watchlists/docker-compose.yml` and update it:

```yaml
services:
  app:
    build: .
    container_name: compare-letterboxd-watchlists
    ports:
      - "3000:3000"          # change 3000 if that port is already in use
    volumes:
      - /mnt/user/appdata/compare-letterboxd-watchlists/data:/app/data
    environment:
      - PUID=99              # replace with your uid= value
      - PGID=100             # replace with your gid= value
    restart: unless-stopped
```

#### Step 5 — Start the container

In the Unraid web UI, go to **Docker > Compose**, then click **Add Compose** and point it at `/mnt/user/appdata/compare-letterboxd-watchlists`. Click **Up** to build and start.

Alternatively, from SSH:

```bash
cd /mnt/user/appdata/compare-letterboxd-watchlists
docker compose up --build -d
```

Open `http://<your-unraid-ip>:3000` in a browser.

#### Updating

```bash
cd /mnt/user/appdata/compare-letterboxd-watchlists
git pull
docker compose up --build -d
```

Or use the **Compose Manager** UI to pull and rebuild.

> **Port conflict?** Change `"3000:3000"` to e.g. `"8096:3000"` in `docker-compose.yml`.
> **Architecture:** The Playwright base image supports both `amd64` (most Unraid servers) and `arm64`.

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
