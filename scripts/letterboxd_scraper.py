#!/usr/bin/env python3
"""
Letterboxd scraper using letterboxdpy.
Usage: python3 letterboxd_scraper.py <command> <username> [slug]
Commands: profile, watchlist, watched, list
Output: JSON to stdout, errors to stderr
"""
import sys
import json


def _film_dict(slug: str, name: str, year) -> dict:
    return {'slug': slug, 'title': name, 'year': str(year) if year else ''}


def cmd_profile(username):
    from letterboxdpy.pages.user_profile import UserProfile
    profile = UserProfile(username)
    avatar = profile.get_avatar()
    avatar_url = avatar['url'] if avatar and avatar.get('exists') else None
    print(json.dumps({'avatar_url': avatar_url}))


def cmd_watchlist(username):
    from letterboxdpy.pages.user_watchlist import extract_watchlist
    result = extract_watchlist(username)
    movies = [
        _film_dict(film['slug'], film['name'], film.get('year'))
        for film in result['data'].values()
        if film.get('slug')
    ]
    print(json.dumps(movies))


def cmd_list(username, slug):
    from letterboxdpy.list import List
    lst = List(username, slug)
    title = lst.get_title()
    movies_data = lst.get_movies()
    movies = [
        _film_dict(film['slug'], film['name'], film.get('year'))
        for film in movies_data.values()
        if film.get('slug')
    ]
    print(json.dumps({'title': title, 'movies': movies}))


def cmd_favourites(username):
    from letterboxdpy.constants.project import DOMAIN
    from letterboxdpy.core.scraper import parse_url

    dom = parse_url(f"{DOMAIN}/{username}/")
    section = dom.find("section", {"id": "favourites"})
    if not section:
        print(json.dumps([]))
        return

    movies = []
    for div in section.find_all("div", attrs={"data-item-slug": True}):
        slug = div.get("data-item-slug", "")
        name = div.get("data-item-name", "")
        full = div.get("data-item-full-display-name", "")
        year = ""
        if full and full.endswith(")") and "(" in full:
            try:
                year = full.rsplit("(", 1)[1].rstrip(")")
            except IndexError:
                pass
        if slug:
            movies.append(_film_dict(slug, name, year))
    print(json.dumps(movies))


def cmd_watched(username):
    from letterboxdpy.pages.user_films import UserFilms
    result = UserFilms(username).get_films()
    movies = [
        _film_dict(slug, data['name'], data.get('year'))
        for slug, data in result['movies'].items()
        if slug
    ]
    print(json.dumps(movies))


def cmd_watched_recent(username):
    from letterboxdpy.constants.project import DOMAIN
    from letterboxdpy.core.scraper import parse_url
    from letterboxdpy.pages.user_films import extract_movies_from_user_watched
    from letterboxdpy.utils.utils_url import get_page_url

    base_url = f"{DOMAIN}/{username}/films"
    dom = parse_url(get_page_url(base_url, 1))
    movies_dict = extract_movies_from_user_watched(dom)

    movies = [
        _film_dict(slug, data['name'], data.get('year'))
        for slug, data in movies_dict.items()
        if slug
    ]
    print(json.dumps(movies))


def main():
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Usage: letterboxd_scraper.py <command> <username> [slug]'}))
        sys.exit(1)

    command = sys.argv[1]
    username = sys.argv[2]

    if command == 'list':
        if len(sys.argv) < 4:
            print(json.dumps({'error': 'Usage: letterboxd_scraper.py list <username> <slug>'}))
            sys.exit(1)
        slug = sys.argv[3]
        try:
            cmd_list(username, slug)
        except Exception as e:
            sys.stderr.write(str(e) + '\n')
            sys.exit(1)
        return

    commands = {
        'profile': cmd_profile,
        'watchlist': cmd_watchlist,
        'watched': cmd_watched,
        'watched_recent': cmd_watched_recent,
        'favourites': cmd_favourites,
    }

    if command not in commands:
        print(json.dumps({'error': f'Unknown command: {command}'}))
        sys.exit(1)

    try:
        commands[command](username)
    except Exception as e:
        sys.stderr.write(str(e) + '\n')
        sys.exit(1)


if __name__ == '__main__':
    main()
