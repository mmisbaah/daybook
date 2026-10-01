/* ============================================================
   DAYBOOK — app shell: state, navigation stack, actions, sheets
   ============================================================ */

var S = {
  tab: 'today',
  stacks: {
    today:    [{ id: 'today', params: {} }],
    clients:  [{ id: 'clients', params: {} }],
    requests: [{ id: 'requests', params: {} }],
    booking:  [{ id: 'booking', params: {} }]
  },
  clientFilter: 'all',
  reqSeg: 'requests',
  filled: {},        /* slotId -> clientId */
  filledBy: {},      /* clientId -> slotId */
  sessionState: {},  /* clientId -> live | noshow */
  noteSigned: {},    /* clientId -> true */
  reqState: {},      /* requestId -> accepted | sent */
  bk: {
    visit: 'initial', carrier: 'aetna', mid: 'W2381 00451',
    verified: false, verifying: false, slot: null,
    concerns: [], prior: null, policy: false, done: false
  }
};

(function () {
  'use strict';
  var I = UI.icon, E = UI.esc, AV = UI.ava;
  var viewport = UI.byId('viewport');
  var tabbar = UI.byId('tabbar');
  var sheetLayer = UI.byId('sheetLayer');
  var sheet = UI.byId('sheet');
  var toastEl = UI.byId('toast');

  var TAB_ICON = { today: 'calendarDot', clients: 'users', requests: 'inbox', booking: 'link' };
  var TAB_LABEL = { today: 'Daybook', clients: 'Clients', requests: 'Requests', booking: 'Booking page' };

  /* ---------------- rendering ---------------- */
  function build(entry) {
    var el = document.createElement('section');
    el.className = 'screen';
    el.dataset.id = entry.id;
    el.innerHTML = SCREENS[entry.id](entry);
    return el;
  }

  function renderAll(anim) {
    viewport.innerHTML = '';
    var st = S.stacks[S.tab];
    st.forEach(function (e, i) {
      var el = build(e);
      if (i < st.length - 1) el.classList.add('is-behind');
      if (anim === 'tab') el.classList.add('is-tabin');
      viewport.appendChild(el);
    });
  }

  function refreshTop() {
    var st = S.stacks[S.tab];
    var entry = st[st.length - 1];
    var el = viewport.lastElementChild;
    if (!el) return renderAll();
    var body = el.querySelector('.scr-body');
    var y = body ? body.scrollTop : 0;
    el.innerHTML = SCREENS[entry.id](entry);
    var nb = el.querySelector('.scr-body');
    if (nb) nb.scrollTop = y;
  }
  window.DaybookRefresh = function () { renderAll('tab'); };

  function push(id, params) {
    var st = S.stacks[S.tab];
    var cur = viewport.lastElementChild;
    var body = cur && cur.querySelector('.scr-body');
    if (body) st[st.length - 1].scroll = body.scrollTop;

    var entry = { id: id, params: params || {} };
    st.push(entry);
    var el = build(entry);
    el.classList.add('is-entering');
    viewport.appendChild(el);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.remove('is-entering');
        if (cur) cur.classList.add('is-behind');
      });
    });
  }

  function pop() {
    var st = S.stacks[S.tab];
    if (st.length < 2) return;
    var el = viewport.lastElementChild;
    st.pop();
    var below = el.previousElementSibling;
    if (below) below.classList.remove('is-behind');
    el.classList.add('is-entering');
    var body = below && below.querySelector('.scr-body');
    if (body && st[st.length - 1].scroll) body.scrollTop = st[st.length - 1].scroll;
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 470);
  }

  function switchTab(tab) {
    if (S.tab === tab && S.stacks[tab].length === 1) return;
    if (S.tab !== tab) {
      S.tab = tab;
      renderAll('tab');
    } else {
      /* tapping the active tab pops to root */
      while (S.stacks[tab].length > 1) S.stacks[tab].pop();
      renderAll('tab');
    }
    paintTabs();
  }

  function paintTabs() {
    Array.prototype.forEach.call(tabbar.querySelectorAll('.tab'), function (b) {
      b.classList.toggle('on', b.dataset.tab === S.tab);
    });
  }

  /* ---------------- sheet + toast ---------------- */
  function openSheet(html) {
    sheet.innerHTML = '<div class="grab"></div>' + html;
    sheetLayer.hidden = false;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { sheetLayer.classList.add('open'); });
    });
  }
  function closeSheet() {
    sheetLayer.classList.remove('open');
    setTimeout(function () { sheetLayer.hidden = true; sheet.innerHTML = ''; }, 430);
  }
  var toastTimer;
  function toast(msg, ic) {
    toastEl.hidden = false;
    toastEl.innerHTML = I(ic || 'checkCircle', 'ic-sm') + '<span>' + msg + '</span>';
    requestAnimationFrame(function () { toastEl.classList.add('show'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
      setTimeout(function () { toastEl.hidden = true; }, 340);
    }, 2700);
  }

  /* ---------------- sheets ---------------- */
  function fillSheet() {
    var cands = DB.clients.filter(function (c) { return c.status === 'waitlist'; })
      .sort(function (a, b) { return b.wait.match - a.wait.match; });
    openSheet(
      '<div class="sheet-h"><div class="sh"><h3>Fill today’s 1:00 PM</h3>' +
      '<div class="sub">50 minutes, telehealth, Wednesday. Ranked on coverage, modality, the window they asked for and cadence — not just who tapped first.</div></div>' +
      '<button class="icon-btn" data-act="close-sheet">' + I('x', 'ic-sm') + '</button></div>' +
      '<div class="sheet-body">' + cands.map(function (c, i) {
        return SCREENS._matchCard(c, { offerable: c.wait.match >= 65, stg: true, i: i });
      }).join('') + '</div>' +
      '<div class="sheet-actions">' +
        '<button class="btn btn--quiet" data-act="close-sheet">Leave it open</button>' +
        '<button class="btn btn--soft" data-act="toast" data-msg="Opening offered to all three — first to accept gets it">' + I('spark', 'ic-sm') + 'Offer to all</button>' +
      '</div>'
    );
  }

  function rescheduleSheet(id) {
    var c = DB.get(id);
    var opts = [
      { d: 'Wed 7 Oct', t: '1:00 PM', n: 'same slot next week' },
      { d: 'Tue 6 Oct', t: '4:30 PM', n: 'outside your usual window' },
      { d: 'Thu 8 Oct', t: '9:00 AM', n: 'keeps the weekly cadence' }
    ];
    openSheet(
      '<div class="sheet-h"><div class="sh"><h3>Move ' + E(c.name.split(' ')[0]) + '’s session</h3>' +
      '<div class="sub">Standing slot <b>' + E(c.slotLong) + '</b> stays held until you confirm a new time.</div></div>' +
      '<button class="icon-btn" data-act="close-sheet">' + I('x', 'ic-sm') + '</button></div>' +
      '<div class="sheet-body">' + opts.map(function (o, i) {
        return '<button type="button" class="vtype" data-act="pick-time" data-i="' + i + '" style="margin-bottom:9px">' +
          '<span class="radio"><i></i></span>' +
          '<span class="vt"><h4>' + o.d + ' · ' + o.t + '</h4><p>' + o.n + '</p></span>' +
          '<span class="pr"><span class="c">' + E(c.modality) + '</span></span></button>';
      }).join('') +
      '<div class="verify unset" style="margin-top:4px">' + I('bell', 'ic-sm') +
      '<span>Moving it tells the client by text with the new time attached — <b>no fee</b>, it’s more than 24 hours ahead.</span></div></div>' +
      '<div class="sheet-actions">' +
        '<button class="btn btn--quiet" data-act="close-sheet">Cancel</button>' +
        '<button class="btn btn--primary" data-act="confirm-move">Offer this time</button>' +
      '</div>'
    );
  }

  function noshowSheet(id) {
    var c = DB.get(id);
    openSheet(
      '<div class="sheet-h"><div class="sh"><h3>Mark ' + E(c.name.split(' ')[0]) + ' as a no-show?</h3>' +
      '<div class="sub">This charges the late-cancellation fee and writes a note against the session. The client gets a text either way.</div></div>' +
      '<button class="icon-btn" data-act="close-sheet">' + I('x', 'ic-sm') + '</button></div>' +
      '<div class="sheet-body">' +
        '<div class="flag flag--clay" style="margin:0 0 10px">' + I('card', 'ic-sm') +
        '<span><b>Policy applies:</b> ' + (c.insurance.state === 'self' ? '$75 self-pay fee' : '$75 fee — insurers won’t cover a missed visit') +
        '. Waive it if they called ahead.</span></div>' +
        '<button type="button" class="vtype" data-act="waive" style="margin-bottom:0">' +
          '<span class="radio"><i></i></span><span class="vt"><h4>Waive the fee this once</h4>' +
          '<p>Logged as goodwill — three waivers a year per client.</p></span></button>' +
      '</div>' +
      '<div class="sheet-actions">' +
        '<button class="btn btn--quiet" data-act="close-sheet">Cancel</button>' +
        '<button class="btn btn--clay" data-act="confirm-noshow" data-id="' + id + '">Mark no-show</button>' +
      '</div>'
    );
  }

  function proposeSheet(reqId) {
    var r = DB.requests.filter(function (x) { return x.id === reqId; })[0];
    var opts = ['Wed 8:00 AM', 'Wed 8:50 AM', 'Thu 10:00 AM'];
    openSheet(
      '<div class="sheet-h"><div class="sh"><h3>Send three times</h3>' +
      '<div class="sub">' + E(r.name) + ' picks one; the other two are released to the waitlist automatically.</div></div>' +
      '<button class="icon-btn" data-act="close-sheet">' + I('x', 'ic-sm') + '</button></div>' +
      '<div class="sheet-body"><div class="slots">' + opts.map(function (o) {
        return '<button type="button" class="slotbtn" data-act="pick-time" data-i="0"><span class="lo"></span>' + E(o) + '</button>';
      }).join('') + '</div>' +
      '<div class="verify" style="margin-top:14px">' + I('checkCircle', 'ic-sm') +
      '<span>Coverage already verified, consent on file — accepting is one tap for them.</span></div></div>' +
      '<div class="sheet-actions">' +
        '<button class="btn btn--quiet" data-act="close-sheet">Cancel</button>' +
        '<button class="btn btn--primary" data-act="confirm-propose" data-id="' + reqId + '">Send the offer</button>' +
      '</div>'
    );
  }

  /* ---------------- action dispatch ---------------- */
  function act(el, a) {
    var d = el.dataset;

    switch (a) {
      case 'back': pop(); break;
      case 'tab': switchTab(d.tab); break;
      case 'push': push(d.screen, { id: d.id }); break;
      case 'close-sheet': closeSheet(); break;
      case 'toast': toast(d.msg); closeSheetIfOpen(); break;

      case 'filter': S.clientFilter = d.filter; refreshTop(); break;
      case 'seg': S.reqSeg = d.seg; refreshTop(); break;

      /* --- session lifecycle --- */
      case 'start-session': {
        var c = DB.get(d.id);
        S.sessionState[d.id] = 'live';
        refreshTop();
        toast('<b>' + E(c.name.split(' ')[0]) + '</b> joined the waiting room — mic and camera ready', 'video');
        break;
      }
      case 'sign-note':
        S.noteSigned[d.id] = true;
        refreshTop();
        toast('Note signed and locked to the record', 'stamp');
        break;
      case 'noshow': noshowSheet(d.id); break;
      case 'confirm-noshow':
        S.sessionState[d.id] = 'noshow';
        closeSheet(); refreshTop();
        toast('No-show logged · $75 fee queued for the invoice', 'alert');
        break;
      case 'waive': closeSheet(); toast('Fee waived once — logged as goodwill'); break;
      case 'reschedule': rescheduleSheet(d.id); break;
      case 'confirm-move': closeSheet(); toast('New time offered — they’ll confirm by text'); break;
      case 'pick-time': {
        var sibs = el.parentNode.querySelectorAll('.vtype, .slotbtn');
        Array.prototype.forEach.call(sibs, function (s) { s.classList.remove('on'); });
        el.classList.add('on');
        break;
      }

      /* --- waitlist filling --- */
      case 'fill-sheet': fillSheet(); break;
      case 'fill-confirm': {
        var cl = DB.get(d.id);
        S.filled['open-1'] = cl.id;
        S.filledBy[cl.id] = 'open-1';
        closeSheet();
        refreshTop();
        toast('<b>' + E(cl.name) + '</b> booked into 1:00 PM · welcome text sent', 'spark');
        break;
      }

      /* --- requests --- */
      case 'req-accept':
        S.reqState[d.id] = 'accepted';
        refreshTop();
        toast('Booked — intake and consent sent automatically');
        break;
      case 'req-propose': proposeSheet(d.id); break;
      case 'confirm-propose':
        S.reqState[d.id] = 'sent';
        closeSheet(); refreshTop();
        toast('Three times sent · the others return to the waitlist');
        break;

      /* --- booking page --- */
      case 'bk-visit': S.bk.visit = d.v; refreshTop(); break;
      case 'bk-carrier':
        S.bk.carrier = d.v; S.bk.verified = false; refreshTop(); break;
      case 'bk-verify': {
        var inp = document.getElementById('memberId');
        if (inp) S.bk.mid = inp.value;
        S.bk.verifying = true; refreshTop();
        setTimeout(function () {
          S.bk.verifying = false; S.bk.verified = true; refreshTop();
          var car = DB.booking.carriers.filter(function (x) { return x.id === S.bk.carrier; })[0];
          toast(car.ok === null
            ? '<b>United</b> pending — you’ll be texted within one business day'
            : '<b>' + E(car.name) + '</b> verified · copay shown below', 'shield');
        }, 950);
        break;
      }
      case 'bk-slot': S.bk.slot = d.v; refreshTop(); break;
      case 'bk-concern': {
        var i = S.bk.concerns.indexOf(d.v);
        if (i > -1) S.bk.concerns.splice(i, 1); else S.bk.concerns.push(d.v);
        refreshTop();
        break;
      }
      case 'bk-prior': S.bk.prior = d.v; refreshTop(); break;
      case 'bk-policy':
        S.bk.policy = !S.bk.policy; refreshTop();
        if (S.bk.policy) toast('Policy accepted — insurance and forms already covered');
        break;
      case 'bk-submit':
        if (!S.bk.slot) { toast('Pick a time first'); break; }
        if (!S.bk.policy) { toast('Please confirm the cancellation policy first', 'alert'); break; }
        S.bk.done = true; refreshTop();
        toast('Request sent to Naomi · usually confirmed same day');
        break;
      case 'bk-reset':
        S.bk.done = false; S.bk.slot = null; S.bk.policy = false;
        refreshTop();
        break;
    }
  }

  function closeSheetIfOpen() { if (!sheetLayer.hidden) closeSheet(); }

  /* ---------------- listeners ---------------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (t) { act(t, t.dataset.act); return; }
    var tab = e.target.closest ? e.target.closest('.tab') : null;
    if (tab) switchTab(tab.dataset.tab);
  });

  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'memberId') S.bk.mid = e.target.value;
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !sheetLayer.hidden) closeSheet();
  });

  /* ---------------- boot ---------------- */
  function boot() {
    Array.prototype.forEach.call(tabbar.querySelectorAll('.tab'), function (b) {
      b.querySelector('.tab-ic').innerHTML = I(TAB_ICON[b.dataset.tab]);
      b.setAttribute('aria-label', TAB_LABEL[b.dataset.tab]);
    });
    paintTabs();
    renderAll('tab');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
