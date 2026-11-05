"""AquaType backend: Flask + SQLite. Run: python app.py"""
import mimetypes, os, re, secrets, sqlite3, time
from datetime import datetime, timedelta, timezone
from functools import wraps
from math import sqrt
from flask import Flask, current_app, g, jsonify, request, send_from_directory, session
from werkzeug.security import check_password_hash, generate_password_hash

BASE = os.path.dirname(os.path.abspath(__file__))
# Windows can map .js/.css to the wrong type (e.g. text/plain), and browsers then refuse to run them.
for _ext, _type in ((".js", "text/javascript"), (".mjs", "text/javascript"), (".css", "text/css"), (".svg", "image/svg+xml"),
                    (".json", "application/json"), (".webmanifest", "application/manifest+json"), (".html", "text/html")):
    mimetypes.add_type(_type, _ext)
DURATIONS = (15, 30, 60, 120)
MODES = ("free", "timed", "expedition", "precision", "endless", "custom", "story", "symbols", "weak")
DIFFS = {"easy": 1.0, "mid": 1.3, "hard": 1.6}
MAX_CPS = 25  # keystrokes per second considered humanly possible
REGIONS = [
 ("Sunlit Lagoon", "Warm, shallow water for first dives.", 0, "Clownfish", "common", "Clownfish live among anemone tentacles that protect them."),
 ("Coral Kingdom", "Intermediate passages and reef restoration.", 100, "Green sea turtle", "common", "Green turtles can hold their breath for hours while resting."),
 ("Jellyfish Forest", "Precision challenges in drifting light.", 250, "Moon jelly", "uncommon", "Jellyfish have no brain, heart or bones."),
 ("Sunken City", "Advanced passages among ancient ruins.", 500, "Bottlenose dolphin", "uncommon", "Dolphins use clicks and echoes to find food."),
 ("Abyssal Frontier", "High-difficulty expeditions into the dark.", 900, "Lantern shark", "rare", "Some small sharks make their own light."),
 ("Thermal Vents", "Endurance dives with long passages.", 1400, "Dumbo octopus", "rare", "Dumbo octopuses flap ear-like fins to swim."),
 ("Trench of Secrets", "Expert challenges and rare finds.", 2200, "Vampire squid", "legendary", "It lives in low-oxygen water far below sunlight.")]
ACH = [("first", "First Dive", "Complete your first typing session.", "sessions", 1),
 ("smooth", "Smooth Current", "Finish a dive with 95% accuracy or better.", "accuracy", 95),
 ("fast", "Fast Fin", "Reach 40 WPM.", "wpm", 40),
 ("perfect", "Perfect Passage", "Finish a dive of 20+ characters with no mistakes.", "perfect", 0),
 ("days", "Consistent Diver", "Practice on 3 different days.", "days", 3),
 ("coll", "Marine Collector", "Discover 4 creatures.", "creatures", 4),
 ("reef", "Reef Guardian", "Reach 1000 XP (thriving ecosystem).", "xp", 1000),
 ("deep", "Deep Explorer", "Unlock the Abyssal Frontier.", "regions", 5)]
PASSAGES = {
 "easy": ["the sea is calm and blue", "a small fish swims past the reef", "waves roll in with the tide", "sand shifts under the warm light",
          "we dive down to see the coral", "the turtle glides through clear water", "bubbles rise to the bright surface", "a crab walks across the rock"],
 "mid": ["The current carries us toward the Coral Kingdom, where colours glow.", "Every careful keystroke feeds the reef, so type with patience.",
         "A jellyfish drifts by; its tentacles trail like silk ribbons.", "Divers log their finds: sponges, anemones, and a hidden cave.",
         "Light fades slowly as the water grows colder and deeper."],
 "hard": ["At 120 metres, the ruins appear: arches, stairs, and a door (sealed since 1893).",
          "Bioluminescence, pressure, silence: the trench rewards steady, accurate hands.",
          "Warning! Oxygen at 38%; ascend slowly, or risk decompression sickness.",
          "The log reads: day 14, depth 612 m, temperature 4 degrees, no contact."]}
CHALLENGES = [("reef_rescue", "Reef Rescue: finish a dive of 30+ characters with 95% accuracy or better.", 95),
 ("deep_dive", "Deep Dive: complete a 120 second dive.", 120),
 ("perfect_current", "Perfect Current: finish a 15 second dive with no mistakes.", 15),
 ("pressure", "Pressure Challenge: reach 30 WPM in a 60 second dive.", 30)]
CHALLENGE_XP = 60


def now(): return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def level(xp): return int(sqrt(xp / 50)) + 1
def err(msg, code=400): return jsonify(error=msg), code


def db():
    if "db" not in g:
        g.db = sqlite3.connect(current_app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db


def init_db(path):
    c = sqlite3.connect(path)
    with open(os.path.join(BASE, "schema.sql"), encoding="utf-8") as f:
        c.executescript(f.read())
    if not c.execute("SELECT 1 FROM ocean_regions").fetchone():
        for i, r in enumerate(REGIONS):
            cur = c.execute("INSERT INTO ocean_regions(name,description,unlock_requirement,display_order) VALUES(?,?,?,?)", (r[0], r[1], r[2], i))
            c.execute("INSERT INTO creatures(name,rarity,habitat_region_id,educational_description) VALUES(?,?,?,?)", (r[3], r[4], cur.lastrowid, r[5]))
        c.executemany("INSERT INTO achievements(code,name,description,criteria_type,criteria_value) VALUES(?,?,?,?,?)", ACH)
        c.executemany("INSERT INTO passages(text,difficulty) VALUES(?,?)", [(t, d) for d, ts in PASSAGES.items() for t in ts])
    c.commit(); c.close()


def num(d, key, lo, hi):
    v = d.get(key)
    if isinstance(v, bool) or not isinstance(v, int) or not lo <= v <= hi:
        raise ValueError(f"{key} must be an integer from {lo} to {hi}")
    return v


def current_user():
    uid = session.get("uid")
    return db().execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone() if uid else None


def login_required(f):
    @wraps(f)
    def w(*a, **k):
        g.user = current_user()
        return f(*a, **k) if g.user else err("Login required.", 401)
    return w


def rate(n, per=60):
    def deco(f):
        @wraps(f)
        def w(*a, **k):
            limit = n * 1000 if current_app.testing else n
            hits, key, t = current_app.extensions["hits"], (f.__name__, request.remote_addr), time.time()
            q = [x for x in hits.get(key, []) if t - x < per]
            if len(q) >= limit:
                return err("Too many requests. Please wait a moment.", 429)
            hits[key] = q + [t]
            return f(*a, **k)
        return w
    return deco


def user_json(u):
    return {"id": u["id"], "username": u["username"], "level": u["current_level"], "total_xp": u["total_xp"],
            "privacy": {"show_on_leaderboard": bool(u["show_on_leaderboard"]), "public_profile": bool(u["public_profile"])}}


def unlocked_regions(xp): return [r for r in REGIONS if xp >= r[2]]


def challenge_met(kind, s):
    return {"reef_rescue": s["accuracy"] >= 95 and s["correct_characters"] >= 30,
            "deep_dive": s["duration_seconds"] == 120,
            "perfect_current": s["duration_seconds"] == 15 and s["error_count"] == 0 and s["correct_characters"] >= 15,
            "pressure": s["duration_seconds"] == 60 and s["wpm"] >= 30}[kind]


def today_challenge():
    d = datetime.now(timezone.utc).date()
    kind, _, target = CHALLENGES[d.toordinal() % len(CHALLENGES)]
    db().execute("INSERT OR IGNORE INTO daily_challenges(challenge_date,challenge_type,target_value,reward_xp) VALUES(?,?,?,?)", (d.isoformat(), kind, target, CHALLENGE_XP))
    db().commit()
    return db().execute("SELECT * FROM daily_challenges WHERE challenge_date=?", (d.isoformat(),)).fetchone()


def add_xp(uid, amount):
    row = db().execute("SELECT total_xp FROM users WHERE id=?", (uid,)).fetchone()
    old, new = row["total_xp"], row["total_xp"] + amount
    db().execute("UPDATE users SET total_xp=?, current_level=? WHERE id=?", (new, level(new), uid))
    fresh = []
    for rid, r in enumerate(REGIONS, 1):
        if old < r[2] <= new or (r[2] == 0 and not db().execute("SELECT 1 FROM user_discoveries WHERE user_id=? AND creature_id=?", (uid, rid)).fetchone()):
            if db().execute("INSERT OR IGNORE INTO user_discoveries(user_id,creature_id,discovered_at) VALUES(?,?,?)", (uid, rid, now())).rowcount:
                fresh.append({"region": r[0], "creature": r[3], "rarity": r[4], "fact": r[5]})
    return new, fresh


def new_achievements(uid, s):
    q = lambda sql, *a: db().execute(sql, a).fetchone()[0]
    facts = {"sessions": q("SELECT COUNT(*) FROM typing_sessions WHERE user_id=?", uid),
             "days": q("SELECT COUNT(DISTINCT substr(completed_at,1,10)) FROM typing_sessions WHERE user_id=?", uid),
             "creatures": q("SELECT COUNT(*) FROM user_discoveries WHERE user_id=?", uid),
             "xp": q("SELECT total_xp FROM users WHERE id=?", uid)}
    facts["regions"] = len(unlocked_regions(facts["xp"]))
    out = []
    for a in db().execute("SELECT * FROM achievements").fetchall():
        t, v = a["criteria_type"], a["criteria_value"]
        ok = (s["error_count"] == 0 and s["correct_characters"] > 20) if t == "perfect" else (s[{"accuracy": "accuracy", "wpm": "wpm"}[t]] >= v if t in ("accuracy", "wpm") else facts[t] >= v)
        if ok and db().execute("INSERT OR IGNORE INTO user_achievements(user_id,achievement_id,unlocked_at) VALUES(?,?,?)", (uid, a["id"], now())).rowcount:
            out.append({"code": a["code"], "name": a["name"]})
    return out


def create_app(config=None):
    app = Flask(__name__, instance_relative_config=True)
    os.makedirs(app.instance_path, exist_ok=True)
    prod = os.environ.get("AQUATYPE_ENV") == "production"
    app.config.update(
        SECRET_KEY=os.environ.get("SECRET_KEY") or ("dev-" + secrets.token_hex(16)),
        DATABASE=os.path.join(app.instance_path, "aquatype.db"),
        SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SECURE=prod,
        SESSION_COOKIE_SAMESITE=os.environ.get("SAMESITE", "Lax"),
        PERMANENT_SESSION_LIFETIME=timedelta(days=14), MAX_CONTENT_LENGTH=32 * 1024,
        FRONTEND_DIR=os.environ.get("FRONTEND_DIR") or next((p for p in (os.path.join(BASE, "..", "frontend"), os.path.join(BASE, "frontend")) if os.path.isdir(p)), ""),
        CORS_ORIGIN=os.environ.get("CORS_ORIGIN", ""))
    if prod and not os.environ.get("SECRET_KEY"):
        raise RuntimeError("Set SECRET_KEY in production.")
    app.config.update(config or {})
    app.extensions["hits"] = {}
    init_db(app.config["DATABASE"])

    @app.teardown_appcontext
    def close(_):
        c = g.pop("db", None)
        if c: c.close()

    @app.before_request
    def guard():  # CSRF defence: JSON-only writes cannot be forged cross-site without a CORS preflight
        if request.path.startswith("/api/") and request.method in ("POST", "PUT", "PATCH", "DELETE") and not request.is_json:
            return err("Content-Type must be application/json.", 415)

    @app.after_request
    def cors(r):
        o = app.config["CORS_ORIGIN"]
        if o and request.headers.get("Origin") == o:
            r.headers.update({"Access-Control-Allow-Origin": o, "Access-Control-Allow-Credentials": "true",
                              "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS", "Vary": "Origin"})
        if request.path.startswith("/api/"):
            r.headers.setdefault("X-Content-Type-Options", "nosniff")
        return r

    for code, msg in ((400, "Bad request."), (404, "Not found."), (405, "Method not allowed."), (413, "Request too large.")):
        app.register_error_handler(code, lambda e, m=msg: err(m, e.code))

    def body():
        d = request.get_json(silent=True)
        return d if isinstance(d, dict) else {}

    @app.get("/api/health")
    def health(): return jsonify(status="ok")

    # ---------- authentication ----------
    @app.post("/api/auth/register")
    @rate(10)
    def register():
        d = body()
        name, email, pw = str(d.get("username", "")).strip(), str(d.get("email", "")).strip(), str(d.get("password", ""))
        if not re.fullmatch(r"[A-Za-z0-9_]{3,20}", name): return err("Username must be 3 to 20 letters, numbers or underscores.", 422)
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email) or len(email) > 120: return err("Enter a valid email address.", 422)
        if len(pw) < 8 or len(pw) > 128: return err("Password must be 8 to 128 characters.", 422)
        try:
            cur = db().execute("INSERT INTO users(username,email,password_hash,created_at) VALUES(?,?,?,?)", (name, email, generate_password_hash(pw), now()))
            add_xp(cur.lastrowid, 0); db().commit()
        except sqlite3.IntegrityError:
            return err("That username or email is already registered.", 409)
        session.clear(); session["uid"] = cur.lastrowid; session.permanent = True
        return jsonify(user=user_json(current_user())), 201

    @app.post("/api/auth/login")
    @rate(10)
    def login():
        d = body()
        u = db().execute("SELECT * FROM users WHERE email=?", (str(d.get("email", "")).strip(),)).fetchone()
        if not u or not check_password_hash(u["password_hash"], str(d.get("password", ""))): return err("Invalid email or password.", 401)
        session.clear(); session["uid"] = u["id"]; session.permanent = True
        return jsonify(user=user_json(u))

    @app.post("/api/auth/logout")
    def logout():
        session.clear(); return jsonify(ok=True)

    @app.get("/api/auth/me")
    @login_required
    def me(): return jsonify(user=user_json(g.user))

    # ---------- passages ----------
    @app.get("/api/passages")
    def passages():
        diff = request.args.get("difficulty")
        limit = min(max(request.args.get("limit", 20, type=int), 1), 50)
        sql, args = "SELECT id,text,difficulty,category,language FROM passages WHERE is_active=1", []
        if diff in DIFFS: sql, args = sql + " AND difficulty=?", [diff]
        rows = db().execute(sql + " ORDER BY RANDOM() LIMIT ?", args + [limit]).fetchall()
        return jsonify(passages=[dict(r) for r in rows])

    @app.get("/api/passages/<int:pid>")
    def passage(pid):
        r = db().execute("SELECT id,text,difficulty,category,language FROM passages WHERE id=? AND is_active=1", (pid,)).fetchone()
        return jsonify(dict(r)) if r else err("Passage not found.", 404)

    # ---------- typing sessions (scores are recomputed and validated here) ----------
    @app.post("/api/sessions")
    @login_required
    @rate(60)
    def post_session():
        d, uid = body(), g.user["id"]
        try:
            dur, correct = num(d, "duration_seconds", 1, 600), num(d, "correct_characters", 0, 20000)
            total, errors = num(d, "total_evaluated_keystrokes", 0, 30000), num(d, "error_count", 0, 30000)
        except ValueError as e:
            return err(str(e), 422)
        cid, mode, diff = str(d.get("client_id", "")), d.get("mode"), d.get("difficulty")
        if not re.fullmatch(r"[A-Za-z0-9-]{8,64}", cid): return err("client_id must be 8 to 64 letters, numbers or dashes.", 422)
        if mode not in MODES or diff not in DIFFS or dur not in DURATIONS and mode not in ("endless", "story"): return err("Invalid mode, difficulty or duration.", 422)
        old = db().execute("SELECT * FROM typing_sessions WHERE user_id=? AND client_id=?", (uid, cid)).fetchone()
        if old: return jsonify(session=dict(old), duplicate=True)  # idempotent: no double rewards
        if total == 0 or correct > total or errors > total or total > dur * MAX_CPS: return err("Session data is not valid.", 422)
        wpm, acc = round(correct / 5 / (dur / 60)), round(correct / total * 100)
        if wpm > 300: return err("Score rejected as not humanly possible.", 422)
        pid = d.get("passage_id") if isinstance(d.get("passage_id"), int) else None
        if pid and not db().execute("SELECT 1 FROM passages WHERE id=?", (pid,)).fetchone(): pid = None
        xp = round(correct * 0.3 * (acc / 100) ** 2 * DIFFS[diff]) if correct > 5 else 0
        cur = db().execute("""INSERT INTO typing_sessions(user_id,client_id,mode,difficulty,passage_id,duration_seconds,correct_characters,
            total_evaluated_keystrokes,error_count,wpm,accuracy,xp_awarded,completed_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (uid, cid, mode, diff, pid, dur, correct, total, errors, wpm, acc, xp, now()))
        total_xp, fresh = add_xp(uid, xp)
        ach = new_achievements(uid, {"accuracy": acc, "wpm": wpm, "error_count": errors, "correct_characters": correct})
        db().commit()
        return jsonify(session={"id": cur.lastrowid, "wpm": wpm, "accuracy": acc, "duration_seconds": dur, "xp_awarded": xp}, total_xp=total_xp,
                       level=level(total_xp), new_discoveries=fresh, new_achievements=ach), 201

    @app.get("/api/sessions/history")
    @login_required
    def history():
        limit, off = min(max(request.args.get("limit", 20, type=int), 1), 100), max(request.args.get("offset", 0, type=int), 0)
        rows = db().execute("""SELECT id,mode,difficulty,duration_seconds,wpm,accuracy,error_count,xp_awarded,completed_at FROM typing_sessions
            WHERE user_id=? ORDER BY completed_at DESC, id DESC LIMIT ? OFFSET ?""", (g.user["id"], limit, off)).fetchall()
        return jsonify(sessions=[dict(r) for r in rows])

    @app.get("/api/sessions/stats")
    @login_required
    def stats():
        r = db().execute("""SELECT COUNT(*) n, COALESCE(MAX(wpm),0) best_wpm, COALESCE(ROUND(AVG(wpm)),0) avg_wpm, COALESCE(ROUND(AVG(accuracy)),0) avg_accuracy,
            COALESCE(MAX(accuracy),0) best_accuracy, COALESCE(SUM(duration_seconds),0) seconds FROM typing_sessions WHERE user_id=?""", (g.user["id"],)).fetchone()
        days = {x[0] for x in db().execute("SELECT DISTINCT substr(completed_at,1,10) FROM typing_sessions WHERE user_id=?", (g.user["id"],))}
        day, streak = datetime.now(timezone.utc).date(), 0
        if day.isoformat() not in days: day -= timedelta(days=1)
        while day.isoformat() in days: streak, day = streak + 1, day - timedelta(days=1)
        return jsonify(sessions=r["n"], best_wpm=r["best_wpm"], average_wpm=r["avg_wpm"], average_accuracy=r["avg_accuracy"],
                       best_accuracy=r["best_accuracy"], total_practice_seconds=r["seconds"], practice_streak_days=streak)

    # ---------- progression ----------
    @app.get("/api/progress")
    @login_required
    def progress():
        u = g.user
        n = lambda t: db().execute(f"SELECT COUNT(*) FROM {t} WHERE user_id=?", (u["id"],)).fetchone()[0]
        reef = sum(u["total_xp"] >= x for x in (0, 50, 200, 500, 1000))
        return jsonify(user=user_json(u), regions_unlocked=len(unlocked_regions(u["total_xp"])), regions_total=len(REGIONS),
                       creatures_discovered=n("user_discoveries"), achievements_unlocked=n("user_achievements"), reef_stage=reef)

    @app.get("/api/regions")
    def regions():
        u = current_user(); xp = u["total_xp"] if u else 0
        return jsonify(regions=[{"id": i, "name": r[0], "description": r[1], "unlock_xp": r[2], "unlocked": xp >= r[2]} for i, r in enumerate(REGIONS, 1)])

    @app.get("/api/discoveries")
    @login_required
    def discoveries():
        rows = db().execute("""SELECT c.name,c.rarity,c.educational_description AS fact,r.name AS region,d.discovered_at FROM user_discoveries d
            JOIN creatures c ON c.id=d.creature_id JOIN ocean_regions r ON r.id=c.habitat_region_id WHERE d.user_id=? ORDER BY d.discovered_at""", (g.user["id"],)).fetchall()
        return jsonify(discoveries=[dict(r) for r in rows])

    @app.get("/api/achievements")
    def achievements():
        u = current_user()
        got = {r[0]: r[1] for r in db().execute("SELECT achievement_id,unlocked_at FROM user_achievements WHERE user_id=?", (u["id"],))} if u else {}
        rows = db().execute("SELECT * FROM achievements").fetchall()
        return jsonify(achievements=[{"code": a["code"], "name": a["name"], "description": a["description"], "unlocked": a["id"] in got, "unlocked_at": got.get(a["id"])} for a in rows])

    @app.get("/api/challenges/today")
    def challenge_today():
        c, u = today_challenge(), current_user()
        text = next(t for k, t, _ in CHALLENGES if k == c["challenge_type"])
        done = bool(u and db().execute("SELECT 1 FROM challenge_completions WHERE user_id=? AND challenge_id=?", (u["id"], c["id"])).fetchone())
        return jsonify(id=c["id"], date=c["challenge_date"], type=c["challenge_type"], description=text, target=c["target_value"], reward_xp=c["reward_xp"], completed=done)

    @app.post("/api/challenges/<int:cid>/complete")
    @login_required
    def challenge_complete(cid):
        c, uid = today_challenge(), g.user["id"]
        if cid != c["id"]: return err("Only today's challenge can be completed.", 422)
        if db().execute("SELECT 1 FROM challenge_completions WHERE user_id=? AND challenge_id=?", (uid, cid)).fetchone(): return err("Already completed.", 409)
        rows = db().execute("SELECT * FROM typing_sessions WHERE user_id=? AND substr(completed_at,1,10)=? AND mode NOT IN ('custom')", (uid, c["challenge_date"])).fetchall()
        if not any(challenge_met(c["challenge_type"], r) for r in rows): return err("Requirements not met by today's saved sessions.", 422)
        db().execute("INSERT INTO challenge_completions(user_id,challenge_id,completed_at,reward_status) VALUES(?,?,?,'granted')", (uid, cid, now()))
        total, fresh = add_xp(uid, c["reward_xp"]); db().commit()
        return jsonify(reward_xp=c["reward_xp"], total_xp=total, level=level(total), new_discoveries=fresh)

    # ---------- leaderboards ----------
    def board(days=None):
        limit = min(max(request.args.get("limit", 25, type=int), 1), 100)
        cond, args = ("AND s.completed_at >= ?", [(datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")]) if days else ("", [])
        rows = db().execute(f"""SELECT u.username, MAX(s.wpm) AS best_wpm, MAX(s.accuracy) AS best_accuracy, COUNT(*) AS sessions FROM typing_sessions s
            JOIN users u ON u.id=s.user_id WHERE u.show_on_leaderboard=1 AND s.mode!='custom' AND s.duration_seconds>=30 AND s.correct_characters>=50 {cond}
            GROUP BY u.id ORDER BY best_wpm DESC, best_accuracy DESC LIMIT ?""", args + [limit]).fetchall()
        return jsonify(leaderboard=[dict(r, rank=i) for i, r in enumerate(rows, 1)], rules="Minimum 30 second session with 50 correct characters. Custom text excluded.")

    @app.get("/api/leaderboards/global")
    def lb_global(): return board()

    @app.get("/api/leaderboards/weekly")
    def lb_weekly(): return board(7)

    # ---------- account: privacy, export, deletion ----------
    @app.patch("/api/account/privacy")
    @login_required
    def privacy():
        d = body()
        for k in ("show_on_leaderboard", "public_profile"):
            if k in d:
                if not isinstance(d[k], bool): return err(f"{k} must be true or false.", 422)
                db().execute(f"UPDATE users SET {k}=? WHERE id=?", (int(d[k]), g.user["id"]))
        db().commit()
        return jsonify(user=user_json(current_user()))

    @app.get("/api/account/export")
    @login_required
    def export():
        uid, rows = g.user["id"], lambda sql: [dict(r) for r in db().execute(sql, (g.user["id"],)).fetchall()]
        return jsonify(user=user_json(g.user), email=g.user["email"], created_at=g.user["created_at"],
                       sessions=rows("SELECT * FROM typing_sessions WHERE user_id=?"), discoveries=rows("SELECT * FROM user_discoveries WHERE user_id=?"),
                       achievements=rows("SELECT * FROM user_achievements WHERE user_id=?"), challenge_completions=rows("SELECT * FROM challenge_completions WHERE user_id=?"))

    @app.delete("/api/account")
    @login_required
    @rate(5)
    def delete_account():
        if not check_password_hash(g.user["password_hash"], str(body().get("password", ""))): return err("Password is incorrect.", 403)
        db().execute("DELETE FROM users WHERE id=?", (g.user["id"],)); db().commit(); session.clear()
        return jsonify(ok=True)

    # ---------- optional: serve the frontend from ./frontend ----------
    @app.get("/")
    @app.get("/<path:path>")
    def static_files(path="index.html"):
        root = app.config["FRONTEND_DIR"]
        if path.startswith("api/") or not os.path.isdir(root): return err("Not found.", 404)
        full = os.path.join(root, path)
        if not os.path.isfile(full):
            path = "index.html"
        return send_from_directory(root, path)

    return app


if __name__ == "__main__":
    create_app().run(host="127.0.0.1", port=int(os.environ.get("PORT", 5000)), debug=os.environ.get("AQUATYPE_ENV") != "production")