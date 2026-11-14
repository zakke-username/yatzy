# Yatzy

Multiplayer browser Yatzy written in TypeScript.

Play: **[freeyatzy.com](https://freeyatzy.com/)**

Simple, quick, easy. No login. Start a game for 1-8 players with a couple of clicks.

## Tech stack

- **React + Vite** front-end
- **Express** HTTP routing
- **Socket.io** for real time communication
- **Redis** as state storage, to allow for multiple server instances

## Requirements

- Node.js (22.22+)
- Redis 7+

## Setup

Start Redis, using Docker for example:

```sh
docker run -d --name free-yatzy-redis -p 127.0.0.1:6379:6379 redis:8-alpine
```

Then run from repository's root:

```sh
npm install
npm run dev
```

## Repo structure

```
client/   Front end app: pages, components, hooks, etc. (pages, components, hooks, lib)
server/   Express + Socket.IO: game engine, routes, sockets, store
shared/   Types used by both
```
