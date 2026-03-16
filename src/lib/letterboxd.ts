import * as cheerio from 'cheerio';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Movie, WatchedMovie } from './types';

chromium.use(StealthPlugin());

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'max-age=0',
  // Cloudflare requires UA Client Hints (Sec-CH-UA-*) to pass bot detection
  'Sec-CH-UA': '"Chromium";v="120", "Google Chrome";v="120", "Not-A.Brand";v="99"',
  'Sec-CH-UA-Mobile': '?0',
  'Sec-CH-UA-Platform': '"macOS"',
  'Sec-CH-UA-Platform-Version': '"13.6.0"',
  'Sec-CH-UA-Arch': '"arm"',
  'Sec-CH-UA-Bitness': '"64"',
  'Sec-CH-UA-Full-Version': '"120.0.6099.130"',
  'Sec-CH-UA-Full-Version-List': '"Chromium";v="120.0.6099.130", "Google Chrome";v="120.0.6099.130", "Not-A.Brand";v="99.0.0.0"',
  'Sec-CH-UA-Model': '""',
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugFromUrl(url: string): string {
  // e.g. https://letterboxd.com/film/sinners-2025/ -> sinners-2025
  const match = url.match(/\/film\/([^/]+)\/?$/);
  return match ? match[1] : url;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: BROWSER_HEADERS,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function extractSlugsFromHtml(html: string): Array<{ slug: string; title: string; year: string }> {
  const $ = cheerio.load(html);
  const items: Array<{ slug: string; title: string; year: string }> = [];

  $('div.react-component[data-component-class="LazyPoster"]').each((_, el) => {
    const slug = $(el).attr('data-item-slug') ?? '';
    const fullName = $(el).attr('data-item-full-display-name') ?? $(el).attr('data-item-name') ?? '';
    const yearMatch = fullName.match(/\((\d{4})\)$/);
    const year = yearMatch ? yearMatch[1] : '';
    const title = fullName.replace(/\s*\(\d{4}\)$/, '').trim() || fullName;
    if (slug) items.push({ slug, title, year });
  });

  if (items.length > 0) return items;

  $('li.poster-container > div.film-poster').each((_, el) => {
    const slug = $(el).attr('data-film-slug') ?? '';
    const title = $(el).attr('data-film-name') ?? '';
    const year = $(el).attr('data-film-year') ?? '';
    if (slug) items.push({ slug, title, year });
  });

  return items;
}

function parseFilmPosters(html: string): Movie[] {
  return extractSlugsFromHtml(html).map(({ slug, title, year }) => ({
    title,
    year,
    slug,
    director: null,
    poster_url: null,
    letterboxd_url: `https://letterboxd.com/film/${slug}/`,
    tmdb_id: null,
    genres: [],
    rating: null,
  }));
}

function parseWatchedPosters(html: string): WatchedMovie[] {
  return extractSlugsFromHtml(html).map(({ slug, title, year }) => ({
    title,
    year,
    slug,
    letterboxd_url: `https://letterboxd.com/film/${slug}/`,
  }));
}


export async function fetchAllWatched(
  username: string,
  onProgress?: (page: number) => void
): Promise<WatchedMovie[]> {
  const all: WatchedMovie[] = [];
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: BROWSER_HEADERS['User-Agent'],
      locale: 'en-US',
    });
    const browserPage = await context.newPage();

    let page = 1;
    while (true) {
      onProgress?.(page);
      const url = `https://letterboxd.com/${username}/films/page/${page}/`;
      await browserPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for Cloudflare challenge to clear, then wait for film list to render
      await browserPage.waitForFunction(
        () => !document.title.toLowerCase().includes('just a moment'),
        { timeout: 15000 }
      ).catch(() => {});
      await browserPage.waitForSelector(
        'div.react-component[data-component-class="LazyPoster"], li.poster-container, .cols-6',
        { timeout: 10000 }
      ).catch(() => {});

      const html = await browserPage.content();
      const movies = parseWatchedPosters(html);
      if (movies.length === 0) break;
      all.push(...movies);
      page++;
      await sleep(500);
    }
  } finally {
    await browser.close();
  }
  return all;
}

// Scrape only page 1 of /films/ — used for incremental sync to pick up recent watches
export async function fetchRecentWatched(username: string): Promise<WatchedMovie[]> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: BROWSER_HEADERS['User-Agent'],
      locale: 'en-US',
    });
    const browserPage = await context.newPage();
    const url = `https://letterboxd.com/${username}/films/page/1/`;
    await browserPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await browserPage.waitForFunction(
      () => !document.title.toLowerCase().includes('just a moment'),
      { timeout: 15000 }
    ).catch(() => {});
    await browserPage.waitForSelector(
      'div.react-component[data-component-class="LazyPoster"], li.poster-container, .cols-6',
      { timeout: 10000 }
    ).catch(() => {});
    const html = await browserPage.content();
    return parseWatchedPosters(html);
  } finally {
    await browser.close();
  }
}

export async function fetchWatchlist(username: string): Promise<Movie[]> {
  const all: Movie[] = [];
  let page = 1;
  while (true) {
    const url = `https://letterboxd.com/${username}/watchlist/page/${page}/`;
    const html = await fetchHtml(url);
    const movies = parseFilmPosters(html);
    if (movies.length === 0) break;
    all.push(...movies);
    page++;
    await sleep(500);
  }
  return all;
}

export async function fetchProfileInfo(
  username: string
): Promise<{ avatar_url: string | null }> {
  const url = `https://letterboxd.com/${username}/`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  // Check for not-found / private
  if ($('.error-404').length || $('body.error').length) {
    throw new Error('Profile not found or is private');
  }

  const avatar_url = $('.avatar img').first().attr('src') ?? null;

  return { avatar_url };
}
