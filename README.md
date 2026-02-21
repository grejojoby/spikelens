# SpikeLens

**SpikeLens** is a desktop GUI manager for [Aerospike](https://aerospike.com/) — a fast, native app built with Tauri, React, and a Go backend sidecar. It gives you a clean interface to browse records, run queries, execute AQL, inspect cluster health, and manage secondary indexes — all without touching the CLI.

---

## Features

| Feature | Description |
|---|---|
| **Connection Manager** | Save and switch between multiple Aerospike cluster connections |
| **Record Browser** | Navigate namespaces and sets via a tree view; inspect individual records side-by-side |
| **Visual Query Builder** | Build and run queries with filters and scan limits — no syntax required |
| **AQL Editor** | Full-featured AQL editor with syntax highlighting, query history, and a cheatsheet sidebar |
| **Cluster Dashboard** | Live cluster stats with per-node memory, object counts, and health indicators |
| **Index Manager** | View, create, and drop secondary indexes with a guided UI |
| **Dark / Light theme** | Toggle between themes from the app shell |

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Zustand, TanStack Query, Monaco Editor, Recharts
- **Backend**: Go (chi router, Aerospike Go client v7, Gorilla WebSocket)
- **Shell**: Tauri v2 (Rust) — packages the frontend + Go binary into a native desktop app

---

## Prerequisites

| Tool | Version |
|---|---|
| [Node.js](https://nodejs.org/) | 18+ |
| [Go](https://go.dev/) | 1.21+ |
| [Rust + Cargo](https://rustup.rs/) | stable |
| [Tauri CLI prerequisites](https://v2.tauri.app/start/prerequisites/) | platform-specific |

> **macOS**: install Xcode Command Line Tools (`xcode-select --install`).
> **Linux**: install `libwebkit2gtk-4.1-dev`, `libssl-dev`, and other [Tauri deps](https://v2.tauri.app/start/prerequisites/#linux).
> **Windows**: install the Microsoft C++ Build Tools and WebView2.

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/grejo-j/spikelens.git
cd spikelens
```

### 2. Install Node dependencies

```bash
npm install
```

### 3. Install Rust target (if not already set up)

```bash
rustup update stable
```

---

## Running in Development

SpikeLens has two parts: the Go backend sidecar and the Tauri desktop shell.

### Option A — Full dev mode (Tauri window + hot reload)

```bash
npm run tauri:dev
```

This will:
1. Build the Go backend binary into `src-tauri/binaries/`
2. Start the Tauri dev window with hot-reloading frontend

### Option B — Web only (browser, no Tauri)

Run the Go backend and Vite dev server side-by-side:

```bash
npm run dev:full
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

Or start them separately:

```bash
# Terminal 1 — Go backend (default: port 8080)
npm run dev:backend

# Terminal 2 — Vite frontend
npm run dev
```

---

## Building for Production

### Build the desktop app (all platforms)

```bash
npm run tauri:build
```

This will:
1. Build the Go backend binary for the current target triple
2. Compile and bundle the React frontend
3. Package everything into a native installer (`.dmg`, `.AppImage`, `.msi`) in `src-tauri/target/release/bundle/`

### Build frontend only

```bash
npm run build
```

Output goes to `dist/`.

### Build Go backend only

```bash
npm run build:backend
```

The binary is placed in `src-tauri/binaries/` as `spikelens-server-<target-triple>`.

You can also pass a specific Rust target triple:

```bash
bash scripts/build-backend.sh aarch64-apple-darwin
```

---

## Project Structure

```
spikelens/
├── backend/                  # Go backend (REST + WebSocket API)
│   ├── cmd/server/           # Entrypoint
│   └── internal/
│       ├── aerospike/        # Aerospike client logic
│       ├── api/              # HTTP handlers
│       ├── aql/              # AQL execution
│       ├── models/           # Shared types
│       ├── store/            # Connection store
│       └── ws/               # WebSocket cluster stats
├── src/                      # React frontend
│   ├── components/           # UI components (browser, query, aql, dashboard, indexes)
│   ├── hooks/                # React Query hooks
│   ├── pages/                # Page-level components
│   ├── store/                # Zustand global state
│   ├── api/                  # Axios API client
│   └── types/                # TypeScript types
├── src-tauri/                # Tauri shell (Rust)
│   ├── binaries/             # Built Go sidecar binaries
│   └── tauri.conf.json       # Tauri configuration
├── scripts/
│   ├── build-backend.sh      # Cross-compile Go binary
│   └── tauri.sh              # Tauri CLI wrapper
└── package.json
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server only |
| `npm run dev:backend` | Start Go backend server only |
| `npm run dev:full` | Start both backend and frontend concurrently |
| `npm run tauri:dev` | Build backend + launch full Tauri dev app |
| `npm run build` | Build frontend for production |
| `npm run build:backend` | Build Go backend binary |
| `npm run tauri:build` | Build backend + package full desktop app |
| `npm run lint` | Run ESLint |

---

## License

MIT
