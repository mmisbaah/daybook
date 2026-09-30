/* ============================================================
   DAYBOOK WEB — app shell, state, navigation, actions
   ============================================================ */

var S = {
  nav: 'today',
  clientFilter: 'all',
  reqSeg: 'requests',
  sessionState: {},
  noteSigned: {},
  reqState: {},
  filled: {},
  filledBy: {},
  bk: {
    visit: 'initial',
    carrier: 'aetna',
    mid: '',
    verified: false,
    verifying: false,
    slot: null,
    concerns: [],
    prior: null,
    policy: false,
    done: false
  }
};

var NOTE_DRAFT = {};

/* ---------- navigation ---------- */

function render() {
  var view = document.getElementById('view');
  var html = SCREENS[S.nav]({ id: S.nav, params: (S.params || {}) });
  view.innerHTML = html;
  updateSidebar();
  window.scrollTo(0, 0);
}

function updateSidebar() {
  var items = document.querySelectorAll('.sb-item');
  items.forEach(function (el) {
    el.classList.toggle('on', el.getAttribute('data-nav') === S.nav);
  });
  var badge = document.querySelector('.sb-badge');
  if (badge) {
    var pending = DB.requests.filter(function (r) { return !S.reqState[r.id]; }).length;
    badge.textContent = pending;
    badge.style.display = pending ? 'grid' : 'none';
  }
}

function navTo(name, params) {
  S.nav = name;
  S.params = params || {};
  render();
}

/* ---------- sheets ---------- */

function openSheet(html) {
  var layer = document.getElementById('sheetLayer');
  document.getElementById('sheet').innerHTML = html;
  layer.hidden = false;
}
function closeSheet() {
  document.getElementById('sheetLayer').hidden = true;
  document.getElementById('sheet').innerHTML = '';
}
function closeSheetIfOpen() {
  if (!document.getElementById('sheetLayer').hidden) closeSheet();
}

/* ---------- toast ---------- */

function toast(msg) {
  var layer = document.getElementById('toastLayer');
  var el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = UI.icon('checkCircle', 'ic-sm') + '<span>' + UI.esc(msg) + '</span>';
  layer.appendChild(el);
  setTimeout(function () {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s';
    setTimeout(function () { el.remove(); }, 300);
  }, 2600);
}

/* ---------- action dispatch ---------- */

function act(el, a) {
  var d = el.dataset;

  switch (a) {
    case 'nav': navTo(d.nav, d.id ? { id: d.id } : {}); break;
    case 'open-session': navTo('session', { id: d.id }); break;
    case 'open-client': navTo('client', { id: d.id }); break;
    case 'close-sheet': closeSheet(); break;
    case 'toast': toast(d.msg); closeSheetIfOpen(); break;

    case 'filter': S.clientFilter = d.filter; render(); break;
    case 'seg': S.reqSeg = d.seg; render(); break;

    case 'start-session':
      S.sessionState[d.id] = 'live';
      render();
      toast('Session started — waiting room is open');
      break;

    case 'sign-note':
      S.noteSigned[d.id] = true;
      render();
      toast('Note signed and locked to the record');
      break;

    case 'noshow': noshowSheet(d.id); break;
    case 'confirm-noshow':
      S.sessionState[d.id] = 'noshow';
      closeSheet(); render();
      toast('Marked no-show — $75 policy fee queued');
      break;
    case 'waive': closeSheet(); toast('Fee waived once — logged as goodwill'); break;

    case 'reschedule': rescheduleSheet(d.id); break;
    case 'confirm-move': closeSheet(); toast('New time offered — they’ll confirm by text'); break;

    case 'fill-sheet': fillSheet(d.id); break;
    case 'fill-confirm':
      S.filled['open-1'] = d.id;
      S.filledBy[d.id] = 'open-1';
      closeSheet(); render();
      toast('Opening filled — ' + DB.get(d.id).name + ' took today’s 1:00 PM');
      break;

    case 'req-accept':
      S.reqState[d.id] = 'accepted';
      render();
      toast('Booked — intake and consent sent automatically');
      break;
    case 'req-propose': proposeSheet(d.id); break;
    case 'confirm-propose':
      S.reqState[d.id] = 'sent';
      closeSheet(); render();
      toast('Three times sent · the others return to the waitlist');
      break;

    /* --- booking page --- */
    case 'bk-visit': S.bk.visit = d.v; S.bk.slot = null; render(); break;
    case 'bk-carrier': S.bk.carrier = d.v; S.bk.verified = false; S.bk.verifying = false; render(); break;
    case 'bk-verify': {
      var inp = document.getElementById('memberId');
      if (inp) S.bk.mid = inp.value.trim();
      S.bk.verifying = true;
      S.bk.verified = false;
      render();
      setTimeout(function () {
        S.bk.verifying = false;
        S.bk.verified = true;
        render();
      }, 1200);
      break;
    }
    case 'bk-slot': S.bk.slot = d.v; render(); break;
    case 'bk-concern':
      var i = S.bk.concerns.indexOf(d.v);
      if (i >= 0) S.bk.concerns.splice(i, 1); else S.bk.concerns.push(d.v);
      render();
      break;
    case 'bk-prior': S.bk.prior = d.v; render(); break;
    case 'bk-policy': S.bk.policy = !S.bk.policy; render(); break;
    case 'bk-submit':
      if (!S.bk.policy || !S.bk.slot) return;
      S.bk.done = true;
      render();
      toast('Request sent — Naomi replies within one business day');
      break;
    case 'bk-reset':
      S.bk = { visit: 'initial', carrier: 'aetna', mid: '', verified: false, verifying: false, slot: null, concerns: [], prior: null, policy: false, done: false };
      render();
      break;
  }
}

/* ---------- sheets content ---------- */

function noshowSheet(id) {
  var c = DB.get(id);
  openSheet(
    '<div class="sheet-h"><div class="sh"><h3>Mark no-show</h3>' +
    '<div class="sub">' + UI.esc(c.name) + ' didn’t arrive. The 24-hour policy applies — a $75 fee will be queued for their invoice.</div></div>' +
    '<button class="icon-btn" data-act="close-sheet">' + UI.icon('x', 'ic-sm') + '</button></div>' +
    '<div class="sheet-body"><div class="flag flag--warn">' + UI.icon('alert', 'ic-sm') +
    '<span>Cancelling or moving less than 24 hours ahead costs $75, and insurance won’t pay for a missed visit.</span></div></div>' +
    '<div class="sheet-actions">' +
    '<button class="btn btn--quiet" data-act="waive">Waive this once</button>' +
    '<button class="btn btn--clay" data-act="confirm-noshow" data-id="' + id + '">Mark no-show</button>' +
    '</div>'
  );
}

function rescheduleSheet(id) {
  var c = DB.get(id);
  openSheet(
    '<div class="sheet-h"><div class="sh"><h3>Move ' + UI.esc(c.name.split(' ')[0]) + '’s session</h3>' +
    '<div class="sub">Standing slot ' + UI.esc(c.slot || 'Wednesdays, 3:00 PM') + ' stays held until you confirm a new time.</div></div>' +
    '<button class="icon-btn" data-act="close-sheet">' + UI.icon('x', 'ic-sm') + '</button></div>' +
    '<div class="sheet-body"><div class="slots" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
    '<button class="bk-slot" data-act="confirm-move">Wed 7 Oct · 1:00 PM<span class="left">same slot</span></button>' +
    '<button class="bk-slot" data-act="confirm-move">Thu 8 Oct · 3:00 PM<span class="left">new time</span></button>' +
    '</div></div>' +
    '<div class="sheet-actions">' +
    '<button class="btn btn--quiet" data-act="close-sheet">Cancel</button>' +
    '<button class="btn btn--primary" data-act="confirm-move">Send the offer</button>' +
    '</div>'
  );
}

function fillSheet(waitId) {
  var c = DB.get(waitId);
  openSheet(
    '<div class="sheet-h"><div class="sh"><h3>Match the opening</h3>' +
    '<div class="sub">Today’s 1:00 PM just opened. ' + UI.esc(c.name) + ' is the best waitlist fit.</div></div>' +
    '<button class="icon-btn" data-act="close-sheet">' + UI.icon('x', 'ic-sm') + '</button></div>' +
    '<div class="sheet-body">' +
    '<div class="statgrid" style="margin-bottom:14px">' +
    '<div class="stat"><div class="label">Fit score</div><div class="val">' + (c.wait ? c.wait.score : 80) + '%</div></div>' +
    '<div class="stat"><div class="label">Waiting</div><div class="val" style="font-size:14px">' + UI.esc(c.wait ? c.wait.waited : '') + '</div></div>' +
    '</div>' +
    '<div class="bk-concerns">' + (c.wait && c.wait.criteria ? c.wait.criteria.map(function (cr) {
      return '<span class="fact">' + UI.esc(cr) + '</span>';
    }).join('') : '') + '</div>' +
    '</div>' +
    '<div class="sheet-actions">' +
    '<button class="btn btn--quiet" data-act="close-sheet">Not yet</button>' +
    '<button class="btn btn--primary" data-act="fill-confirm" data-id="' + waitId + '">Offer 1:00 PM</button>' +
    '</div>'
  );
}

function proposeSheet(reqId) {
  var r = DB.requests.filter(function (x) { return x.id === reqId; })[0];
  if (!r) return;
  var opts = ['Wed 8:00 AM', 'Wed 8:50 AM', 'Thu 10:00 AM'];
  openSheet(
    '<div class="sheet-h"><div class="sh"><h3>Send three times</h3>' +
    '<div class="sub">' + UI.esc(r.name) + ' picks one; the other two are released to the waitlist automatically.</div></div>' +
    '<button class="icon-btn" data-act="close-sheet">' + UI.icon('x', 'ic-sm') + '</button></div>' +
    '<div class="sheet-body"><div class="slots" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">' +
    opts.map(function (o) {
      return '<button class="bk-slot" data-act="pick-time" data-i="0"><span class="lo"></span>' + UI.esc(o) + '</button>';
    }).join('') + '</div>' +
    '<div class="verify" style="margin-top:14px;display:flex;gap:8px;align-items:center;font-size:13px;color:var(--ink-2)">' + UI.icon('checkCircle', 'ic-sm') +
    '<span>Coverage already verified, consent on file — accepting is one tap for them.</span></div></div>' +
    '<div class="sheet-actions">' +
    '<button class="btn btn--quiet" data-act="close-sheet">Cancel</button>' +
    '<button class="btn btn--primary" data-act="confirm-propose" data-id="' + reqId + '">Send the offer</button>' +
    '</div>'
  );
}

/* ---------- global click delegation ---------- */

document.addEventListener('click', function (e) {
  var navEl = e.target.closest ? e.target.closest('.sb-item') : null;
  if (navEl) {
    navTo(navEl.getAttribute('data-nav'));
    return;
  }
  var el = e.target.closest ? e.target.closest('[data-act]') : null;
  if (!el) return;
  var a = el.getAttribute('data-act');
  if (!a) return;
  e.preventDefault();
  act(el, a);
});

/* ---------- boot ---------- */

render();
