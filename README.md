# Swastik — Teacher‑Hosted Online Classes

Swastik is a clean, modern, **Zoom‑style online classroom** for teachers. A host clicks
**“Start New Class”**, shares an invite link, admits students from a live waiting room, shares
their screen, switches between meeting layouts, locks the room, and downloads an Excel attendance
sheet — all with **no login, no sign‑up, no accounts**.

Video, audio and screen sharing are powered by **LiveKit**. Real‑time signaling (waiting room,
admit/reject/remove, lock, announcements) runs over **Socket.IO**. State is stored in **MongoDB**
(with an automatic in‑memory fallback so the app runs even without a database).

> There is **no teacher authentication**. Instead, every class generates a secret **host key**.
> The private host link embeds that key, and the backend verifies it for every host action
> (admit, reject, remove, lock/unlock, end, attendance, tokens). Students never receive it.

---

## ✨ Features

- **One‑click class creation** — generates a class code, room name, secret host key, student
  invite link and private host link.
- **Live waiting room** — students request to join; the host sees them in real time and admits or
  rejects with one tap. Survives refreshes on both sides.
- **Zoom‑style classroom** with **4 switchable layouts**: Speaker, Gallery, Screen‑share, Sidebar.
- **Screen sharing** — when the host shares, the screen automatically becomes the main stage for
  everyone; students auto‑focus it.
- **Mic / camera controls** for host and students, with a **camera preview** before joining.
- **Lock / unlock room** — once locked, no new student can enter the waiting or live room.
- **Remove student** — kicks them from the LiveKit room and blocks easy rejoin (per device).
- **Excel attendance** — one click downloads `Swastik_Attendance_<CODE>_<DATE>.xlsx` with date,
  day, time, names, join/allow/remove/leave times and status for every participant.
- **Host announcements** — broadcast read‑only notes to the whole class (no student chat).
- **Premium orange‑white UI** — glassmorphism, smooth transitions, fully responsive from 360 px
  mobile up to desktop.
- **Performance** — LiveKit `adaptiveStream` + `dynacast`, memoized track rendering, lazy‑loaded
  Excel engine, reconnect/connection states, graceful error handling.

---

## 🧱 Tech stack

| Layer    | Tech                                                                              |
| -------- | --------------------------------------------------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS, React Router, Socket.IO client, LiveKit React SDK, xlsx, lucide-react |
| Backend  | Node.js, Express, Socket.IO, Mongoose (MongoDB), LiveKit Server SDK, express-rate-limit, CORS |
| Media    | LiveKit (WebRTC SFU) — audio, video & screen share                                |

---

## 📁 Project structure

```
swastik-meet/
├─ client/                      # React + Vite frontend (runs on :3000)
│  ├─ index.html
│  ├─ vite.config.js
│  ├─ tailwind.config.js
│  ├─ postcss.config.js
│  ├─ .env / .env.example
│  └─ src/
│     ├─ main.jsx  App.jsx  index.css
│     ├─ pages/        # HomePage, HostRoom, JoinPage, WaitingRoom, StudentRoom, Locked/Removed/Rejected/Ended
│     ├─ components/   # Stage, VideoTile, MediaControls, HostControlBar, RightPanel, WaitingRoomPanel, ...
│     ├─ hooks/        # useMediaPreview
│     └─ lib/          # api.js, socket.js, storage.js, format.js
├─ server/                      # Express + Socket.IO backend (runs on :5000)
│  ├─ .env / .env.example
│  ├─ nodemon.json              # dev auto-restart config
│  ├─ logs/                     # app.log + access.log (auto-created, gitignored)
│  └─ src/
│     ├─ index.js  app.js
│     ├─ config/       # env.js, db.js
│     ├─ models/       # ClassSession.js, Participant.js
│     ├─ store/        # repository (MongoDB or in-memory)
│     ├─ routes/       # classes, participants, livekit, attendance
│     ├─ controllers/  # request handlers
│     ├─ services/     # business logic + socket emissions
│     ├─ middleware/   # verifyHostKey, rateLimit, error
│     ├─ socket/       # Socket.IO handlers + io singleton
│     └─ utils/        # codes, sanitize, security, time, ApiError
├─ docker-compose.livekit.yml   # one-command local LiveKit dev server
├─ package.json                 # root convenience scripts
└─ README.md
```

---

## ✅ Prerequisites

- **Node.js 18+** (Node 20/22/24 recommended)
- **MongoDB** running locally — _optional_. If MongoDB is not reachable, Swastik automatically
  falls back to an in‑memory store (data resets when the server restarts).
- **LiveKit server** — _optional but required for audio/video_. Easiest via Docker (below) or use
  free [LiveKit Cloud](https://cloud.livekit.io). Without it, every non‑video feature still works.

---

## 🚀 Install

From the project root (`swastik-meet/`):

```bash
# install both apps
npm run setup
# (equivalent to: npm --prefix server install && npm --prefix client install)
```

Environment files (`server/.env` and `client/.env`) are already included with sensible local
defaults. To recreate them, copy from the examples:

```bash
cp server/.env.example server/.env
cp client/.env.example  client/.env
```

---

## ▶️ Run locally

Open **three terminals** (or skip terminal 3 to run without video):

**Terminal 1 — LiveKit (for audio/video/screen share):**

```bash
npm run livekit
# uses Docker. Equivalent to:
# docker compose -f docker-compose.livekit.yml up
# --dev mode uses the key/secret "devkey"/"secret" which already match your .env
```

**Terminal 2 — Backend (http://localhost:5000):**

```bash
npm run server          # auto-restarts on changes via nodemon
# or: npm --prefix server start   (no watch)
```

> Server logs are written to **`server/logs/`** — `app.log` (startup, DB/LiveKit, errors) and
> `access.log` (every HTTP request, combined format). They're also printed to the console.

**Terminal 3 — Frontend (http://localhost:3000):**

```bash
npm run client
```

Now open **http://localhost:3000** and click **Start New Class**.

> Running without LiveKit? Just skip Terminal 1. The home page, class creation, join page, waiting
> room, admit/reject/remove, lock, announcements and attendance all work — only live media is
> disabled (you’ll see a friendly “Live video is unavailable” panel).

---

## 🍃 MongoDB setup

Swastik connects to `MONGO_URI` (default `mongodb://127.0.0.1:27017/swastik`).

- **Local install:** download MongoDB Community Server and run `mongod`, or on Windows it usually
  runs as a service automatically.
- **Docker:** `docker run -d -p 27017:27017 --name swastik-mongo mongo:7`
- **MongoDB Atlas:** set `MONGO_URI` to your Atlas connection string in `server/.env`.
- **No MongoDB?** Do nothing — the server logs `Falling back to in-memory store` and keeps working.

You can confirm which store is active via `GET http://localhost:5000/api/health` →
`{"store":"mongo"}` or `{"store":"memory"}`.

---

## 🎥 LiveKit setup

Swastik never exposes the LiveKit secret to the browser — the backend mints short‑lived JWT access
tokens (`/api/livekit/host-token`, `/api/livekit/student-token`).

### Option A — Docker dev server (recommended for local)

```bash
npm run livekit
```

This starts `livekit/livekit-server --dev`, which uses the API key/secret **`devkey` / `secret`** —
already configured in `server/.env` and `client/.env`. Nothing else to change.

### Option B — Native binary

Install the [LiveKit CLI/server](https://docs.livekit.io/home/self-hosting/local/) and run:

```bash
livekit-server --dev
```

### Option C — LiveKit Cloud (free tier)

1. Create a project at https://cloud.livekit.io
2. Copy your **API Key**, **API Secret** and **WebSocket URL** (`wss://your-project.livekit.cloud`).
3. Put them in `server/.env`:
   ```
   LIVEKIT_API_KEY=APIxxxxxxxx
   LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxx
   LIVEKIT_URL=wss://your-project.livekit.cloud
   ```
4. Set `client/.env` → `VITE_LIVEKIT_URL=wss://your-project.livekit.cloud` and restart both apps.

---

## 🧪 Testing the full flow

### Host + student

1. Open **http://localhost:3000** → **Start New Class**. You land on `/host/<CODE>?hostKey=…`.
2. Click **Invite link** (top‑right) to copy the student URL.
3. In another browser (or an incognito window / phone), paste the invite link `…/join/<CODE>`.
4. Enter a name, allow camera/mic, see your **preview**, toggle mic/camera, click **Join Class**.
5. The student lands in the **waiting room** (“Waiting for host to allow you…”).
6. Back on the host tab, the student appears under **Waiting**. Click **Allow**.
7. The student is admitted into the **live classroom**; the host sees their tile.

> Tip: use one normal window for the host and one **incognito** window for the student so they get
> separate device IDs and camera permissions.

### Screen share

1. As host, click **Share** in the bottom bar and pick a screen/window.
2. The shared screen becomes the **main stage** for the host and **auto‑focuses** for students; a
   “Screen sharing active” badge appears.
3. Click **Stop Share** to return to the normal video layout.

### Layout switcher (host)

Use the layout control (top of the control bar on mobile, left side on desktop):

- **Speaker** — active speaker/host large, others in a filmstrip.
- **Gallery** — responsive grid of everyone.
- **Screen** — screen share maximized (falls back to speaker if nobody is sharing).
- **Sidebar** — main video on the left, participant tiles down the right.

Transitions are smooth and fully responsive.

### Lock / remove / end

- **Lock** — click Lock; now opening the invite link shows **“This class is locked.”** (HTTP 423).
- **Remove** — open the **In class** tab in the people panel and click the remove icon; the student
  is dropped from LiveKit and sees the **Removed** screen, and can’t easily rejoin.
- **End** — click **End**; everyone is routed to the **Class ended** screen.

---

## 📊 How attendance Excel works

1. Host clicks **Attendance** in the control bar.
2. Frontend calls `GET /api/attendance/<CODE>?hostKey=…`; the backend returns JSON rows + a filename.
3. The browser builds an `.xlsx` with [`xlsx`](https://www.npmjs.com/package/xlsx) (lazy‑loaded only
   when you download) and saves it as e.g. **`Swastik_Attendance_ABC123_2026-06-15.xlsx`**.

Columns: **Date, Day, Time, Class Code, Student Name, Join Request Time, Allowed Time, Status,
Removed Time, Left Time** — including students in every state (waiting, admitted, rejected, removed,
left).

---

## 🔌 API reference

| Method | Endpoint                                   | Auth      | Purpose                            |
| ------ | ------------------------------------------ | --------- | ---------------------------------- |
| POST   | `/api/classes/create`                      | —         | Create a class session             |
| GET    | `/api/classes/:classCode/public`           | —         | Public class info (exists/locked)  |
| GET    | `/api/classes/:classCode/host?hostKey=`    | host key  | Full class info + participants     |
| POST   | `/api/classes/:classCode/lock`             | host key  | Lock the room                      |
| POST   | `/api/classes/:classCode/unlock`           | host key  | Unlock the room                    |
| POST   | `/api/classes/:classCode/end`              | host key  | End the class                      |
| POST   | `/api/participants/join-request`           | rate‑lim. | Student requests to join           |
| GET    | `/api/participants/status/:participantId`  | —         | Student polls their own status     |
| POST   | `/api/participants/:participantId/admit`   | host key  | Admit a student                    |
| POST   | `/api/participants/:participantId/reject`  | host key  | Reject a student                   |
| POST   | `/api/participants/:participantId/remove`  | host key  | Remove an admitted student         |
| GET    | `/api/participants/:classCode?hostKey=`    | host key  | List participants                  |
| POST   | `/api/livekit/host-token`                  | host key  | Mint host LiveKit token            |
| POST   | `/api/livekit/student-token`               | admitted  | Mint student token (admitted only) |
| GET    | `/api/attendance/:classCode?hostKey=`      | host key  | Attendance rows for Excel          |
| GET    | `/api/health`                              | —         | Health + store/LiveKit status      |

### Socket.IO events

**Client → server:** `host-join-room`, `student-join-waiting`, `student-join-live`,
`host-allow-student`, `host-reject-student`, `host-remove-student`, `host-lock-room`,
`host-unlock-room`, `host-end-class`, `host-screen-share`, `host-announcement`, `participant-left`

**Server → client:** `new-waiting-student`, `waiting-list-updated`, `student-admitted`,
`student-rejected`, `student-removed`, `room-locked`, `room-unlocked`, `room-ended`,
`participants-updated`, `screen-share-started`, `screen-share-stopped`, `announcement`

---

## 🔐 Security notes

- No login, but a cryptographically random **host key** gates every host action (constant‑time
  compared on the server). The key lives only in the private host link.
- Students **cannot** admit/reject/remove/lock/end — those endpoints require the host key.
- Students receive a LiveKit token **only after** the host admits them.
- The LiveKit **API secret never reaches the browser**; tokens are minted server‑side.
- Class codes are validated; student names are sanitized (tags/control chars stripped, length
  clamped). Join requests and token requests are rate‑limited.
- Removed/rejected devices are blocked from easily rejoining the same class.

---

## 🚢 Deployment guide

**Backend**

1. Host on Render / Railway / Fly.io / a VPS. Set env vars: `PORT`, `CLIENT_URL` (your deployed
   frontend origin), `MONGO_URI` (e.g. MongoDB Atlas), `LIVEKIT_API_KEY/SECRET/URL` (LiveKit Cloud).
2. Start with `npm --prefix server start`.
3. Ensure WebSocket upgrades are allowed (Socket.IO) by your proxy.

**Frontend**

1. Set `client/.env` → `VITE_API_URL=https://your-api-host` and `VITE_LIVEKIT_URL=wss://…`.
2. `npm --prefix client run build` → deploy the static `client/dist/` to Netlify / Vercel / any
   static host. Add an SPA rewrite so all routes serve `index.html`.

**LiveKit** — use LiveKit Cloud, or self‑host per the
[LiveKit deployment docs](https://docs.livekit.io/home/self-hosting/deployment/).

---

## 🛠️ Troubleshooting

| Symptom | Fix |
| ------- | --- |
| **“Cannot reach the Swastik server.”** | Start the backend (`npm run server`). Confirm `http://localhost:5000/api/health`. |
| **“Live video is unavailable.”** | Start LiveKit (`npm run livekit`) or set valid `LIVEKIT_*` in `server/.env`, then restart the backend. |
| **Connection pill stuck on “Connecting…”** | LiveKit server isn’t reachable. Check `LIVEKIT_URL` and that ports 7880/7881/7882 are open. |
| **Camera/mic not working** | Browsers only allow media on `http://localhost` or HTTPS. Allow permissions; click the camera icon in the URL bar to reset. |
| **Host page says “Host access required.”** | Open the **private host link** (the one with `?hostKey=…`). Don’t share it with students. |
| **Student gets “Class is locked.”** | The host locked the room. Ask them to **Unlock**. |
| **Data disappears after restart** | You’re on the in‑memory store. Run MongoDB and set `MONGO_URI` for persistence. |
| **CORS errors** | Make sure `CLIENT_URL` in `server/.env` matches the frontend origin (`http://localhost:3000`). |
| **Port already in use** | Change `PORT` (backend) or the Vite port in `client/vite.config.js`. |

---

Built with React, Vite, Tailwind, LiveKit, Socket.IO, Express & MongoDB. Enjoy teaching with
**Swastik** 🧡
