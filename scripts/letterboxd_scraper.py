#!/usr/bin/env python3
"""
Letterboxd scraper using letterboxdpy.
Usage: python3 letterboxd_scraper.py <command> <username>
Commands: profile, watchlist, watched
Output: JSON to stdout, errors to stderr
"""
import sys
import json


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
        {
            'slug': film['slug'],
            'title': film['name'],
            'year': str(film['year']) if film.get('year') else '',
        }
        for film in result['data'].values()
        if film.get('slug')
    ]
    print(json.dumps(movies))


def cmd_watched(username):
    from letterboxdpy.pages.user_films import UserFilms
    result = UserFilms(username).get_films()
    movies = [
        {
            'slug': slug,
            'title': data['name'],
            'year': str(data['year']) if data.get('year') else '',
        }
        for slug, data in result['movies'].items()
        if slug
    ]
    print(json.dumps(movies))


def main():
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Usage: letterboxd_scraper.py <command> <username>'}))
        sys.exit(1)

    command = sys.argv[1]
    username = sys.argv[2]

    commands = {
        'profile': cmd_profile,
        'watchlist': cmd_watchlist,
        'watched': cmd_watched,
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
