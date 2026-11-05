# 🌊 AquaType

> **Dive In. Type Fast. Discover More.**

🔗 **Live demo:** [aquatype.netlify.app](https://aquatype.netlify.app)

AquaType is a browser-based typing game with an ocean theme. Type passages to earn XP, unlock seven ocean zones, restore a coral reef, discover creatures, and complete daily expeditions. No account needed to play — progress saves in the browser automatically.

---

## ✨ Features

- **Live WPM & accuracy** tracked on every dive
- **7 unlockable ocean zones** — each with missions, an exclusive theme, and creatures to discover
- **4 themes** — Deep Blue, Coral Dawn, Kelp Forest, Midnight Trench (unlock by levelling up)
- **Zone themes** — collect and equip per-zone themes from the Ocean Map
- **Daily expeditions** — fresh challenge every day with XP bonus
- **Story mode** — decode 4 chapters of the Station Aurora mystery
- **Reef habitat** — place decorations you unlock with XP and dives
- **Long Descent** — endless arcade mode, type words to sink deeper
- **Badges & achievements** — 8 badges trackable in the Progress section
- **Precision / Endless / Symbols / Weak keys** modes
- **Offline-ready** — works as a PWA (installable, no internet needed after first load)
- **Optional backend** — Flask + SQLite API adds accounts, server-side score validation, and a leaderboard

---

## 📁 Project structure

```
AquaType/
├── Frontend/
│   ├── index.html          Main game page
│   ├── css/style.css       All styles + theme variables
│   ├── js/
│   │   ├── app.js          Game engine, zones, themes, canvas
│   │   └── api.js          Optional backend integration
│   ├── assets/             Icons and images
│   ├── sw.js               Service worker (offline / PWA)
│   └── manifest.webmanifest
└── Backend/
    ├── app.py              Flask application + all API routes
    ├── schema.sql          SQLite schema
    ├── requirements.txt    Python dependencies
    └── tests/              Automated tests
```

---

## 🚀 Quick start — frontend only (no install)

Just open `Frontend/index.html` in any modern browser. Everything runs locally. Progress is saved in `localStorage`.

---

## 🖥️ Running with the backend (accounts + leaderboard)

### Requirements
- Python 3.10+

### Setup

```bash
cd Backend
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
python app.py
```

Then open **http://127.0.0.1:5000** in your browser.

The backend serves the frontend files and exposes the API at `/api/...`. Use **Log in** in the top bar to create an account. While logged in, every finished dive is saved to the server with score validation, and the **Leaderboard** section shows the top typists.

> Zone map, story, and habitat progress always live in the browser regardless of login state.

---

## 🔌 API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | — | Health check |
| `POST` | `/api/auth/register` | — | Create account |
| `POST` | `/api/auth/login` | — | Log in |
| `POST` | `/api/auth/logout` | ✓ | Log out |
| `GET` | `/api/auth/me` | ✓ | Current user info |
| `GET` | `/api/passages` | — | Random passages (`?difficulty=easy\|mid\|hard`) |
| `POST` | `/api/sessions` | ✓ | Submit a typing session |
| `GET` | `/api/sessions/history` | ✓ | Session history |
| `GET` | `/api/sessions/stats` | ✓ | Aggregated stats + streak |
| `GET` | `/api/progress` | ✓ | XP, reef stage, regions, creatures |
| `GET` | `/api/regions` | — | All ocean regions + unlock status |
| `GET` | `/api/discoveries` | ✓ | Discovered creatures |
| `GET` | `/api/achievements` | — | All badges + unlock status |
| `GET` | `/api/challenges/today` | — | Today's daily challenge |
| `POST` | `/api/challenges/:id/complete` | ✓ | Claim daily challenge reward |
| `GET` | `/api/leaderboards/global` | — | All-time top typists |
| `GET` | `/api/leaderboards/weekly` | — | Weekly top typists |
| `PATCH` | `/api/account/privacy` | ✓ | Toggle leaderboard / public profile |
| `GET` | `/api/account/export` | ✓ | Full data export |
| `DELETE` | `/api/account` | ✓ | Delete account |

---

## ⚙️ Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | random (dev only) | Flask session secret — **required in production** |
| `AQUATYPE_ENV` | — | Set to `production` to enable secure cookies |
| `PORT` | `5000` | Port the server listens on |
| `CORS_ORIGIN` | — | Allowed CORS origin (e.g. `https://yourdomain.com`) |
| `FRONTEND_DIR` | `../Frontend` | Path to the frontend folder served by Flask |

---

## 📄 License

MIT
