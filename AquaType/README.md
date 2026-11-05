# AquaType

Dive In. Type Fast. Discover More.

    AquaType/
    ├── frontend/   HTML, CSS and JavaScript game (index.html, css/, js/, assets/)
    └── backend/    Flask + SQLite API (app.py, schema.sql, tests/)

## Run the game (frontend only, no install)
Open `frontend/index.html` in your browser. Progress is saved in the browser. Accounts and the leaderboard need the backend.

## Run frontend and backend together
    cd backend
    python3 -m venv .venv
    source .venv/bin/activate        # Windows: .venv\Scripts\activate
    pip install -r requirements.txt
    python app.py

Then open http://127.0.0.1:5000 . The backend serves the frontend and the API at /api/... .
In the page, use **Log in** (top bar) to create an account. While logged in, every finished dive is saved to the
server (scores are validated there), and the **Leaderboard** section shows the top typists. Zone map, story and
habitat progress still live in the browser. If the backend is not running, the game works as before without accounts.

See `backend/README.md` for the API list, environment variables and tests.
