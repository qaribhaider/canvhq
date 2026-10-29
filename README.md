# CanvHQ

A self-hostable whiteboard where canvases are encrypted in your browser before they are saved. It is built on Excalidraw, with workspaces, projects, members and roles around it. Free and open source.

## Try it

```bash
cp .env.example .env
```

In `.env`, set `AUTH_SECRET` (for example with `openssl rand -hex 32`) and `ENABLE_DEV_LOGIN=true`, then:

```bash
docker compose up
```

Open http://localhost:5173. The dev login gives you a one-click account, so you do not need a sign-in provider to look around. You set a passphrase the first time you sign in.

That stack is for development: it has hot reload, a local S3-compatible store and relaxed request limits. `.env.example` lists every setting you can change.

## Run it for real

Use `docker-compose.prod.yml`, S3-compatible storage and a Google sign-in client (other providers may come later). The documentation in the app, under `/docs`, covers it from there: Docker Compose, signing in with Google, a server behind a proxy, storage, backups and restore, upgrading, and every setting.

## Good to know

- Canvas content and images are encrypted in the browser, and the server does not hold a key that opens them. Names of workspaces, projects and canvases, member names and emails, and who belongs to what are stored as readable data.
- There is no passphrase reset. If someone loses their passphrase, their canvases cannot be opened.
- The encrypting happens in your browser, using code the server sends to it. If that server were compromised or run by someone malicious, it could send your browser altered code. Your own computer or browser being compromised is a limit too. Details and the other limits are on the Security page and in [SECURITY.md](SECURITY.md).
- Sign-in is through an OAuth provider only. There are no passwords and no email sending: invitations are links you copy.

## Working on it

`backend/` (NestJS, Prisma, PostgreSQL) and `frontend/` (React, Vite) are separate packages with their own `package.json` and lockfile. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

Apache License 2.0, see [LICENSE](LICENSE) and [NOTICE](NOTICE). The app lists the licences of its dependencies at `/THIRD_PARTY_LICENSES.txt`.
