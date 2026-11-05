/* AquaType API client: optional account, session saving and leaderboard.
   Needs the Flask backend (same origin). Without it the game stays local-only and this file does nothing. */
(function () {
  const A = { user: null }, Q = s => document.querySelector(s);
  async function call(method, path, body) {
    const o = { method, credentials: 'same-origin', headers: {} };
    if (method !== 'GET') { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(body || {}); }
    const r = await fetch('/api' + path, o);
    let d = {}; try { d = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error(d.error || 'Request failed (' + r.status + ')');
    return d;
  }
  window.api = call;
  const uuid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'c' + Date.now() + Math.random().toString(36).slice(2);
  const label = () => { Q('#aq_btn').textContent = A.user ? A.user.username : 'Log in'; };

  function build() {
    const st = document.createElement('style');
    st.textContent = '#aq_dlg label{display:flex;justify-content:space-between;gap:10px;align-items:center;margin:10px 0}#aq_dlg input{background:rgba(0,0,0,.3);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px;font:inherit;max-width:60%}#aq_lbl li{margin:6px 0}#aq_save{color:var(--gold);font-weight:600;margin-bottom:16px}';
    document.head.appendChild(st);
    Q('#sbtn').insertAdjacentHTML('beforebegin', '<button class="tg" id="aq_btn">Log in</button>');
    Q('nav a.l[href="#oceanmap"]').insertAdjacentHTML('afterend', '<a class="l" href="#leaderboard">Leaderboard</a>');
    Q('#oceanmap').insertAdjacentHTML('beforebegin', '<section id="leaderboard"><div class="wrap"><h2>Leaderboard</h2><p class="sub">Top typists on this server. A dive needs 30+ seconds and 50+ correct characters, and custom text is excluded. Log in to appear here.</p><div class="seg" id="aq_tabs"><button data-v="global" aria-pressed="true">All time</button><button data-v="weekly">This week</button></div><ol id="aq_lbl" style="margin-top:18px"></ol></div></section>');
    Q('#res .btn.p').insertAdjacentHTML('beforebegin', '<p id="aq_save" class="note"></p>');
    document.body.insertAdjacentHTML('beforeend', '<dialog id="aq_dlg"><h2>Account</h2><p class="note" id="aq_info"></p><div id="aq_form"><label>Username (new accounts) <input id="aq_u" maxlength="20" autocomplete="username"></label><label>Email <input id="aq_e" type="email" autocomplete="email"></label><label>Password <input id="aq_p" type="password" autocomplete="current-password"></label><button class="btn p" id="aq_in">Log in</button><button class="btn s" id="aq_reg">Create account</button></div><div id="aq_out" hidden><button class="btn s" id="aq_lo">Log out</button></div><p class="msg" id="aq_msg"></p><button class="btn s" id="aq_x">Close</button></dialog>');
    Q('#aq_btn').onclick = open;
    Q('#aq_x').onclick = () => Q('#aq_dlg').close();
    Q('#aq_in').onclick = () => auth('/auth/login', { email: Q('#aq_e').value, password: Q('#aq_p').value });
    Q('#aq_reg').onclick = () => auth('/auth/register', { username: Q('#aq_u').value, email: Q('#aq_e').value, password: Q('#aq_p').value });
    Q('#aq_lo').onclick = async () => { try { await call('POST', '/auth/logout'); } catch (e) {} A.user = null; label(); show(); resetLocalData(); };
    Q('#aq_tabs').onclick = e => { const b = e.target.closest('button'); if (!b) return; [...Q('#aq_tabs').children].forEach(x => x.setAttribute('aria-pressed', x === b)); board(b.dataset.v); };
  }
  async function auth(path, body) {
    const m = Q('#aq_msg'); m.textContent = 'Please wait...';
    try { A.user = (await call('POST', path, body)).user; Q('#aq_p').value = ''; label(); m.textContent = ''; resetLocalData(); await show(); board('global'); }
    catch (e) { m.textContent = e.message; }
  }
  function resetLocalData() {
    sv = {xp:0, best:{}, daily:{}};
    S.set('aq', sv);
    if (typeof ap === 'function') ap();
    if (typeof ui === 'function') ui();
    if (typeof dash === 'function') dash();
    if (typeof reset === 'function') reset();
    if (typeof dqui === 'function') dqui();
    if (typeof zrender === 'function') zrender();
  }
  async function show() {
    const on = !!A.user; Q('#aq_form').hidden = on; Q('#aq_out').hidden = !on;
    Q('#aq_info').textContent = on ? 'Signed in as ' + A.user.username + '. Your dives are saved to your account.' : 'Log in or create an account to save dives and join the leaderboard.';
    if (on) { try { const s = await call('GET', '/sessions/stats'); Q('#aq_info').textContent += ' Saved dives: ' + s.sessions + ', best WPM: ' + s.best_wpm + ', streak: ' + s.practice_streak_days + ' days.'; } catch (e) {} }
  }
  function open() { Q('#aq_msg').textContent = ''; show(); Q('#aq_dlg').showModal(); }
  async function board(w) {
    const ol = Q('#aq_lbl');
    try {
      const d = await call('GET', '/leaderboards/' + w); ol.textContent = '';
      if (!d.leaderboard.length) { ol.textContent = 'No qualifying dives yet. Be the first!'; return; }
      d.leaderboard.forEach(r => { const li = document.createElement('li'); li.textContent = r.username + ': ' + r.best_wpm + ' WPM, best accuracy ' + r.best_accuracy + '% (' + r.sessions + ' dives)'; ol.appendChild(li); });
    } catch (e) { ol.textContent = e.message; }
  }
  async function push() {
    const out = Q('#aq_save'); if (!A.user || !g.keys) { out.textContent = A.user ? '' : 'Log in to save dives to your account.'; return; }
    const mm = { prec: 'precision', sym: 'symbols', weak: 'weak', endless: 'endless', custom: 'custom', story: 'story', free: 'free' }, mode = mm[g.mode] || 'free';
    const el = Math.max(1, Math.round((performance.now() - g.t0) / 1000)), dur = (mode === 'endless' || mode === 'story') ? Math.min(600, el) : g.dur;
    out.textContent = 'Saving to your account...';
    try {
      const r = await call('POST', '/sessions', { client_id: uuid(), mode, difficulty: g.diff, duration_seconds: dur, correct_characters: g.cc, total_evaluated_keystrokes: g.keys, error_count: g.errs });
      out.textContent = 'Saved to your account. Server XP: ' + r.total_xp + ', level ' + r.level + '.' + (r.new_achievements.length ? ' New: ' + r.new_achievements.map(a => a.name).join(', ') + '.' : '');
      board(Q('#aq_tabs [aria-pressed=true]').dataset.v);
    } catch (e) { out.textContent = 'Could not save to your account: ' + e.message; }
  }
  async function boot() {
    try { const h = await fetch('/api/health'); if (!h.ok || (await h.json()).status !== 'ok') return; } catch (e) { return; }
    build();
    try { A.user = (await call('GET', '/auth/me')).user; } catch (e) { resetLocalData(); }
    label(); board('global');
    const f = finish; finish = function () { f(); push(); };
  }
  boot();
})();
