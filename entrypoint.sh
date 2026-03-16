#!/bin/bash
set -e

PUID=${PUID:-1000}
PGID=${PGID:-1000}

echo "Starting with PUID=$PUID, PGID=$PGID"

# Create group if it doesn't already exist with this GID
if ! getent group "$PGID" > /dev/null 2>&1; then
    groupadd -g "$PGID" appgroup
fi

# Create user if it doesn't already exist with this UID
if ! getent passwd "$PUID" > /dev/null 2>&1; then
    useradd -u "$PUID" -g "$PGID" -M -s /bin/sh appuser
fi

# Ensure the data directory is owned by the target user
chown -R "$PUID:$PGID" /app/data

exec gosu "$PUID" node server.js
