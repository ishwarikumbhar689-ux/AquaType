import os, sys, tempfile, unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import create_app


class Api(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.app = create_app({"TESTING": True, "DATABASE": os.path.join(self.tmp.name, "t.db"), "FRONTEND_DIR": "/nonexistent"})
        self.c = self.app.test_client()

    def tearDown(self): self.tmp.cleanup()

    def reg(self, c=None, name="ada", email="ada@example.com"):
        return (c or self.c).post("/api/auth/register", json={"username": name, "email": email, "password": "correct-horse"})

    def sess(self, cid="abcdefgh1", **kw):
        d = dict(client_id=cid, mode="free", difficulty="easy", duration_seconds=30, correct_characters=200, total_evaluated_keystrokes=210, error_count=10)
        d.update(kw)
        return self.c.post("/api/sessions", json=d)

    def test_auth_flow_and_hashing(self):
        r = self.reg(); self.assertEqual(r.status_code, 201)
        self.assertEqual(self.c.get("/api/auth/me").json["user"]["username"], "ada")
        with self.app.app_context():
            from app import db
            self.assertNotIn("correct-horse", db().execute("SELECT password_hash FROM users").fetchone()[0])
        self.c.post("/api/auth/logout", json={})
        self.assertEqual(self.c.get("/api/auth/me").status_code, 401)
        self.assertEqual(self.c.post("/api/auth/login", json={"email": "ada@example.com", "password": "nope"}).status_code, 401)
        self.assertEqual(self.c.post("/api/auth/login", json={"email": "ada@example.com", "password": "correct-horse"}).status_code, 200)

    def test_validation_and_duplicates(self):
        self.assertEqual(self.c.post("/api/auth/register", json={"username": "a", "email": "x", "password": "1"}).status_code, 422)
        self.reg(); self.assertEqual(self.reg().status_code, 409)
        self.assertEqual(self.c.post("/api/auth/login", data="x").status_code, 415)  # JSON only

    def test_session_scoring_and_rewards(self):
        self.assertEqual(self.sess().status_code, 401)
        self.reg()
        r = self.sess(); self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json["session"]["wpm"], 80); self.assertEqual(r.json["session"]["accuracy"], 95)
        self.assertGreater(r.json["session"]["xp_awarded"], 0)
        codes = {a["code"] for a in r.json["new_achievements"]}
        self.assertTrue({"first", "smooth", "fast"} <= codes)
        again = self.sess(); self.assertTrue(again.json["duplicate"])  # idempotent
        self.assertEqual(self.c.get("/api/sessions/history").json["sessions"].__len__(), 1)
        st = self.c.get("/api/sessions/stats").json
        self.assertEqual((st["sessions"], st["best_wpm"], st["practice_streak_days"]), (1, 80, 1))
        self.assertEqual(self.c.get("/api/progress").json["creatures_discovered"], 1)

    def test_cheating_rejected(self):
        self.reg()
        self.assertEqual(self.sess("abcdefgh2", correct_characters=5000, total_evaluated_keystrokes=5000).status_code, 422)
        self.assertEqual(self.sess("abcdefgh3", correct_characters=50, total_evaluated_keystrokes=10).status_code, 422)
        self.assertEqual(self.sess("abcdefgh4", duration_seconds=7).status_code, 422)
        self.assertEqual(self.sess("abcdefgh5", mode="hax").status_code, 422)

    def test_region_unlock(self):
        self.reg()
        for i in range(4): self.sess(f"region-{i}-xx", duration_seconds=60, correct_characters=600, total_evaluated_keystrokes=600, error_count=0, difficulty="hard")
        regs = self.c.get("/api/regions").json["regions"]
        self.assertGreaterEqual(sum(r["unlocked"] for r in regs), 3)
        self.assertGreaterEqual(len(self.c.get("/api/discoveries").json["discoveries"]), 3)

    def test_leaderboard_privacy(self):
        self.reg(); self.sess()
        self.assertEqual(self.c.get("/api/leaderboards/global").json["leaderboard"][0]["username"], "ada")
        self.assertEqual(len(self.c.get("/api/leaderboards/weekly").json["leaderboard"]), 1)
        self.c.patch("/api/account/privacy", json={"show_on_leaderboard": False})
        self.assertEqual(self.c.get("/api/leaderboards/global").json["leaderboard"], [])
        self.sess("abcdefgh9", duration_seconds=15, correct_characters=40, total_evaluated_keystrokes=40, mode="custom")

    def test_daily_challenge_is_verified(self):
        self.reg(); ch = self.c.get("/api/challenges/today").json
        self.assertEqual(self.c.post(f"/api/challenges/{ch['id']}/complete", json={}).status_code, 422)  # no qualifying session yet
        specs = {"reef_rescue": dict(duration_seconds=30, correct_characters=100, total_evaluated_keystrokes=102),
                 "deep_dive": dict(duration_seconds=120, correct_characters=300, total_evaluated_keystrokes=310),
                 "perfect_current": dict(duration_seconds=15, correct_characters=40, total_evaluated_keystrokes=40, error_count=0),
                 "pressure": dict(duration_seconds=60, correct_characters=200, total_evaluated_keystrokes=210)}
        self.sess("challenge-1", **specs[ch["type"]])
        r = self.c.post(f"/api/challenges/{ch['id']}/complete", json={}); self.assertEqual(r.status_code, 200)
        self.assertEqual(self.c.post(f"/api/challenges/{ch['id']}/complete", json={}).status_code, 409)
        self.assertTrue(self.c.get("/api/challenges/today").json["completed"])

    def test_export_and_delete(self):
        self.reg(); self.sess()
        self.assertEqual(len(self.c.get("/api/account/export").json["sessions"]), 1)
        self.assertEqual(self.c.delete("/api/account", json={"password": "wrong"}).status_code, 403)
        self.assertEqual(self.c.delete("/api/account", json={"password": "correct-horse"}).status_code, 200)
        with self.app.app_context():
            from app import db
            self.assertEqual(db().execute("SELECT COUNT(*) FROM typing_sessions").fetchone()[0], 0)

    def test_public_endpoints(self):
        self.assertEqual(len(self.c.get("/api/passages?difficulty=easy").json["passages"]), 8)
        self.assertEqual(self.c.get("/api/passages/1").status_code, 200)
        self.assertEqual(self.c.get("/api/passages/9999").status_code, 404)
        self.assertEqual(len(self.c.get("/api/regions").json["regions"]), 7)
        self.assertEqual(len(self.c.get("/api/achievements").json["achievements"]), 8)


if __name__ == "__main__":
    unittest.main()
