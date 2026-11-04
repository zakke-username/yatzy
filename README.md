# Free Yatzy

Multiplayer browser Yatzy. React + Vite client and Express + Socket.IO server in an npm workspaces monorepo.

## Requirements

Node.js 26 LTS (22.22+ also works).

## Getting started

```sh
npm install
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3000

In development, Vite proxies `/api` and `/socket.io` to the server, so the client only ever talks to its own origin. To simulate several players, open the client in multiple tabs. Each tab is a separate player.

## Scripts

Run from the repo root:

| Script              | Description                                                    |
| ------------------- | -------------------------------------------------------------- |
| `npm run dev`       | Start server (auto-restart) and client (HMR) together          |
| `npm run build`     | Typecheck and build the client to `client/dist`                |
| `npm run typecheck` | Typecheck both workspaces                                      |
| `npm run lint`      | Lint everything with Oxlint                                    |
| `npm run format`    | Format everything with Prettier (`format:check` to only check) |

## Structure

```
client/   React + Vite app (pages, components, hooks, lib)
server/   Express + Socket.IO (routes, socket, store; TypeScript run directly by Node, no build step)
```

The API types live in `server/src/types.ts`, with an identical copy in `client/src/types.ts`. See [NOTES.md](NOTES.md) for the design.
