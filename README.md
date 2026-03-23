# CollabCode — Real-Time Collaborative Code Editor

A production-grade real-time collaborative code editor with live cursor tracking, CRDT-based sync, sandboxed code execution, and interview mode.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Nginx (Port 80)                       │
│              Reverse Proxy + Load Balancer               │
└──────┬──────────────────┬─────────────────┬─────────────┘
       │                  │                 │
       ▼                  ▼                 ▼
┌────────────┐  ┌──────────────────┐  ┌──────────────┐
│  React     │  │  Node.js Server  │  │  Executor    │
│  Frontend  │  │  Express + WS    │  │  (Docker)    │
│  (Monaco)  │  │  Socket.IO + Yjs │  │  Sandbox     │
└────────────┘  └────────┬─────────┘  └──────────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
        ┌──────────┐         ┌──────────┐
        │PostgreSQL│         │  Redis   │
        │ Rooms    │         │ Pub/Sub  │
        │ Files    │         │ Presence │
        │ Versions │         │ Sessions │
        └──────────┘         └──────────┘
```

## How Real-Time Sync Works

1. **Yjs CRDT**: Each file has a `Y.Doc` document. Monaco Editor is bound via `y-monaco`.
2. **WebSocket**: Changes are sent via a dedicated WS server at `/yjs`.
3. **Redis Pub/Sub**: Multiple server instances share Yjs updates via Redis channels, enabling horizontal scaling.
4. **Persistence**: Doc state is saved to Redis (fast) and PostgreSQL (durable) every 5 seconds.

## Quick Start

### Prerequisites
- Node.js 18+
- Docker + Docker Compose

### Setup

```bash
# Clone and enter the project
cd collaborative-code-editor

# Run automated setup (installs deps, starts DB, runs migrations, builds executor images)
chmod +x scripts/setup.sh
./scripts/setup.sh

# Start all dev servers
npm run dev
```

Open http://localhost:5173

### Manual Setup

```bash
# Install all workspace dependencies
npm install

# Start infrastructure
docker-compose up -d postgres redis

# Run database migrations
npm run migrate

# Build executor sandbox images
./scripts/build-executors.sh

# Start backend
cd server && npm run dev

# Start frontend (new terminal)
cd client && npm run dev
```

## Project Structure

```
collaborative-code-editor/
├── client/          # React + TypeScript + Monaco Editor
│   └── src/
│       ├── components/  # UI components
│       ├── hooks/       # useRoom, useYjs, useExecution
│       ├── pages/       # Home, Room, Login
│       ├── services/    # API, Socket.IO client
│       └── store/       # Zustand state
├── server/          # Node.js + Express + Socket.IO
│   └── src/
│       ├── api/         # REST routes + middleware
│       ├── websocket/   # Socket.IO + Yjs provider
│       ├── db/          # PostgreSQL queries + migrations
│       └── cache/       # Redis helpers
├── executor/        # Docker-based code runner
│   ├── src/         # Execution service
│   └── containers/  # Language-specific Dockerfiles
├── shared/          # Shared TypeScript types
├── nginx/           # Nginx config
└── scripts/         # Setup + build scripts
```

## Features

| Feature | Implementation |
|---------|---------------|
| Real-time sync | Yjs CRDT + y-websocket |
| Live cursors | Socket.IO cursor events + Monaco decorations |
| Presence | Redis hash maps + heartbeat |
| Code execution | Docker sandbox (no network, no root) |
| Interview mode | Lock/unlock, timer, question panel |
| Version history | PostgreSQL with 50-version limit per file |
| Horizontal scaling | Redis pub/sub for Yjs state propagation |

## Security

- Execution sandbox: `NetworkMode: none`, `CapDrop: ALL`, no root, PID limits
- JWT authentication with configurable expiry
- Rate limiting on all endpoints (express-rate-limit)
- Helmet.js security headers
- Zod input validation on all API endpoints
- SQL injection protection via parameterized queries

## Supported Languages

| Language | Image |
|----------|-------|
| JavaScript | `collab-executor-js:latest` |
| TypeScript | `collab-executor-js:latest` |
| Python 3 | `collab-executor-python:latest` |
| Java 21 | `collab-executor-java:latest` |
| C++ | `collab-executor-cpp:latest` |

## Environment Variables

See `.env.example` for all configuration options.

## Scaling to 10,000+ Users

1. **Stateless API servers** behind a load balancer
2. **Redis pub/sub** propagates Yjs CRDT updates across all server instances
3. **Redis** stores active room/user state (not DB)
4. **PostgreSQL connection pooling** via pg Pool (configurable)
5. **Nginx** with `least_conn` load balancing
6. Each room only consumes resources when users are present
