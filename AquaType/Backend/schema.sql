CREATE TABLE IF NOT EXISTS users(
 id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 password_hash TEXT NOT NULL, created_at TEXT NOT NULL, current_level INTEGER NOT NULL DEFAULT 1,
 total_xp INTEGER NOT NULL DEFAULT 0, show_on_leaderboard INTEGER NOT NULL DEFAULT 1, public_profile INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS passages(
 id INTEGER PRIMARY KEY, text TEXT NOT NULL UNIQUE, difficulty TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'general',
 language TEXT NOT NULL DEFAULT 'en', is_active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS typing_sessions(
 id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, client_id TEXT NOT NULL,
 mode TEXT NOT NULL, difficulty TEXT NOT NULL, passage_id INTEGER REFERENCES passages(id),
 duration_seconds INTEGER NOT NULL, correct_characters INTEGER NOT NULL, total_evaluated_keystrokes INTEGER NOT NULL,
 error_count INTEGER NOT NULL, wpm INTEGER NOT NULL, accuracy INTEGER NOT NULL, xp_awarded INTEGER NOT NULL DEFAULT 0,
 completed_at TEXT NOT NULL, UNIQUE(user_id, client_id));
CREATE INDEX IF NOT EXISTS idx_sessions_user ON typing_sessions(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_sessions_wpm ON typing_sessions(wpm);
CREATE TABLE IF NOT EXISTS ocean_regions(
 id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT NOT NULL, unlock_requirement INTEGER NOT NULL, display_order INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS creatures(
 id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, rarity TEXT NOT NULL, habitat_region_id INTEGER NOT NULL REFERENCES ocean_regions(id),
 educational_description TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS user_discoveries(
 id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 creature_id INTEGER NOT NULL REFERENCES creatures(id), discovered_at TEXT NOT NULL, UNIQUE(user_id, creature_id));
CREATE TABLE IF NOT EXISTS achievements(
 id INTEGER PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT NOT NULL,
 criteria_type TEXT NOT NULL, criteria_value INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS user_achievements(
 id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 achievement_id INTEGER NOT NULL REFERENCES achievements(id), unlocked_at TEXT NOT NULL, UNIQUE(user_id, achievement_id));
CREATE TABLE IF NOT EXISTS daily_challenges(
 id INTEGER PRIMARY KEY, challenge_date TEXT NOT NULL UNIQUE, challenge_type TEXT NOT NULL, target_value INTEGER NOT NULL, reward_xp INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS challenge_completions(
 id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 challenge_id INTEGER NOT NULL REFERENCES daily_challenges(id), completed_at TEXT NOT NULL, reward_status TEXT NOT NULL, UNIQUE(user_id, challenge_id));
