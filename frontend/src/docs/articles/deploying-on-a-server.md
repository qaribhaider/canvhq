# Deploying on a server

CanvHQ runs the same way on a rented server, a machine at home or a platform that runs Docker Compose. This page lists what the host needs. Follow your hosting provider's own documentation for creating the server and for DNS.

## What you need

- A machine that runs Docker with Compose, with enough disk for the database. Canvases and images live in your bucket, not on the machine.
- A domain name that points at it.
- **TLS in front of CanvHQ.** The app speaks plain HTTP on port 3000 and expects a reverse proxy (any proxy you like) to add HTTPS. Sign-in cookies are marked secure in production, so people cannot sign in over plain HTTP.
- S3-compatible object storage and a Google sign-in client.

## Steps

1. Install Docker on the machine (see Docker's documentation).
2. Follow [Run with Docker Compose](/docs/run-with-docker-compose). Set `AUTH_URL` and `FRONTEND_URL` to your public address, for example `https://canvas.example.org`.
3. Point your proxy at `127.0.0.1:3000` and make it forward the original client address in `X-Forwarded-For`.
4. Set `TRUST_PROXY=1`, one for the one proxy in front. See [Going public](/docs/going-public).
5. Check `https://your-address/api/health`. It answers when the app and database are up.

## Platforms that run Compose files

The repository has a compose file for platforms that fill in some variables for you: `docker-compose.coolify.yml`. It is written for Coolify, and [Deploying on Coolify](/docs/deploying-on-coolify) walks through it. Other platforms can use `docker-compose.prod.yml`.

## After it is running

- Back up the database and the bucket together: [Backups and restore](/docs/backups-and-restore).
- Read [Upgrading](/docs/upgrading) before you pull a new version.
- Decide whether you want limits or a private instance: [Going public](/docs/going-public).
