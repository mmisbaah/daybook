/* ============================================================
   DAYBOOK WEB — desktop screens
   ============================================================ */

var SCREENS = {};

(function () {
  'use strict';
  var I = UI.icon, E = UI.esc, AV = UI.ava;

  /* ---------- shared helpers ---------- */

  function modalityEdge(m) {
    return m === 'In-person' ? 'var(--slate)' : m === 'Either' ? 'var(--gold)' : 'var(--pine)';
  }
  function insuranceMicro(c) {
    if (c.insurance.state === 'self') return 'SELF-PAY · ' + c.insurance.copay;
    return c.insurance.carrier.toUpperCase() + ' · ' + c.insurance.copay;
  }
  function statusChip(c, item) {
    var st = S.sessionState[c.id];
    if (st === 'live') return '<span class="chip chip--live"><span class="dot"></span>In session</span>';
    if (st === 'noshow') return '<span class="chip chip--alert">No-show</span>';
    if (item && item.state === 'past') {
      if (item.note === 'signed' || S.noteSigned[c.id]) return '<span class="chip chip--ok">' + I('check', 'ic-xs') + 'Note signed</span>';
      return '<span class="chip chip--warn">Note due</span>';
    }
    if (c.status === 'intake' && c.since === 'Today') return '<span class="chip chip--warn">First session</span>';
    return '';
  }
  function kindLine(c, item, withModality) {
    var type = item && item.type ? item.type
      : (c.status === 'intake' && c.since === 'Today' ? 'Intake & history' : 'Return session');
    var dur = item && item.dur ? item.dur : (type === 'Intake & history' ? 80 : 50);
    return type + ' · ' + dur + ' min' + (withModality ? ' · ' + c.modality : '');
  }
  function modIcon(m) {
    return m === 'Telehealth' ? I('video', 'ic-xs') : m === 'In-person' ? I('pin', 'ic-xs') : I('repeat', 'ic-xs');
  }

  function sessionCard(c, item) {
    var cls = 'scard', st = S.sessionState[c.id];
    if (item.state === 'past' && !st) cls += ' is-done';
    if (st === 'live') cls += ' is-live';
    if (st === 'noshow') cls += ' is-noshow';

    var noteRow = '';
    if (st === 'live') {
      noteRow = '<div class="scard-note">' + I('video', 'ic-sm') + '<span>Waiting room open — ' + E(c.name.split(' ')[0]) + ' joined 40 seconds ago.</span></div>';
    } else if (st === 'noshow') {
      noteRow = '<div class="scard-note">' + I('alert', 'ic-sm') + '<span>Marked no-show. Policy fee $75 queued for the invoice.</span></div>';
    } else if (item.state === 'past') {
      var signed = item.note === 'signed' || S.noteSigned[c.id];
      noteRow = signed
        ? '<div class="scard-note">' + I('checkCircle', 'ic-sm') + '<span>Note signed · ready for the record.</span></div>'
        : '<div class="scard-note">' + I('note', 'ic-sm') + '<span><b>Session note not started.</b> Sign it before tomorrow 9:00 AM.</span></div>';
    } else {
      noteRow = '<div class="scard-note">' + I('spark', 'ic-sm') + '<span>' + E(c.prep) + '</span></div>';
    }

    var chipTxt = statusChip(c, item);
    var cadence = chipTxt
      ? c.cadence.toUpperCase()
      : c.cadence.toUpperCase() + ' · SINCE ' + c.since.toUpperCase();

    return '<button type="button" class="' + cls + '" style="--edge:' + modalityEdge(c.modality) + '" ' +
      'data-act="open-session" data-id="' + c.id + '">' +
      '<span class="scard-top">' + AV(c.name) +
        '<span class="scard-id"><h4>' + E(c.name) + '</h4><p>' + modIcon(c.modality) + E(kindLine(c, item)) + '</p></span>' +
      '</span>' +
      '<span class="scard-foot">' +
        '<span class="micro">' + insuranceMicro(c) + '</span><span class="sep"></span>' +
        '<span class="micro">' + E(cadence) + '</span>' +
        (chipTxt ? '<span style="margin-left:auto">' + chipTxt + '</span>' : '') +
      '</span>' + noteRow + '</button>';
  }

  function groupCard(g) {
    var roster = ['MR', 'DP', 'PR', 'TB', 'HK', 'CD'];
    var chips = roster.slice(0, g.attending).map(function (n) {
      return '<span class="ava ava--sm" style="--tone:' + UI.tone(n) + '">' + n + '</span>';
    }).join('');
    return '<div class="scard is-group">' +
      '<span class="scard-top">' + I('users', 'ic-sm') +
        '<span class="scard-id"><h4>' + E(g.name) + '</h4><p>' + g.attending + ' attending · ' + g.dur + ' min · ' + E(g.room) + '</p></span>' +
        '<span class="chip chip--gold" style="margin-left:auto">Group</span>' +
      '</span>' +
      '<span class="scard-foot">' + chips + '<span class="micro" style="margin-left:auto">' + g.attending + ' SEATS OPEN</span></span>' +
      '<div class="scard-note">' + I('repeat', 'ic-sm') + '<span>' + E(g.note) + '</span></div>' +
      '</div>';
  }

  function slotCard(slot) {
    return '<div class="scard" style="border-left-color:var(--gold)">' +
      '<span class="scard-top">' + I('clock', 'ic-sm') +
        '<span class="scard-id"><h4>Open slot</h4><p>' + E(slot.label) + '</p></span>' +
        '<span class="chip chip--gold" style="margin-left:auto">Fill</span>' +
      '</span>' +
      '<span class="scard-foot"><span class="micro">WAITLIST AUTO-FILLS</span></span>' +
      '<div class="scard-note">' + I('spark', 'ic-sm') + '<span>Offer to the top waitlisted client, or share the booking link.</span></div>' +
      '</div>';
  }

  /* ---------- TODAY ---------- */

  SCREENS.today = function () {
    var active = DB.clients.filter(function (c) { return c.status === 'active'; }).length;
    var intake = DB.clients.filter(function (c) { return c.status === 'intake'; }).length;
    var notesDue = DB.timeline.filter(function (t) { return t.state === 'past' && t.note !== 'signed' && !S.noteSigned[t.id]; }).length;
    var openings = DB.openSlots ? DB.openSlots.length : 1;

    var metrics =
      '<div class="metric metric--pine"><div class="label">Active caseload</div><div class="value">' + active + '</div><div class="note">of 20 max</div></div>' +
      '<div class="metric metric--warn"><div class="label">Openings today</div><div class="value">' + openings + '</div><div class="note">waitlist auto-fills</div></div>' +
      '<div class="metric metric--alert"><div class="label">Notes due</div><div class="value">' + notesDue + '</div><div class="note">sign by tomorrow 9 AM</div></div>' +
      '<div class="metric metric--ok"><div class="label">Intake due</div><div class="value">' + intake + '</div><div class="note">PHQ-9 + consent</div></div>';

    var days = ['Sun 27', 'Mon 28', 'Tue 29', 'Wed 30', 'Thu 1', 'Fri 2', 'Sat 3'];
    var dows = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    var weekstrip = '<div class="weekstrip">' + days.map(function (d, i) {
      var on = i === 3 ? ' on' : '';
      var load = [3, 5, 2, 6, 4, 1, 0][i];
      return '<div class="wd' + on + '"><div class="dow">' + dows[i] + '</div><div class="dnum">' + d.split(' ')[1] + '</div><div class="dbar"><i style="width:' + (load / 6 * 100) + '%"></i></div></div>';
    }).join('') + '</div>';

    var items = DB.timeline.map(function (item) {
      if (item.kind === 'group') return groupCard(item);
      var c = DB.get(item.id);
      if (!c) return '';
      return sessionCard(c, item);
    }).join('');

    var openSlot = DB.openSlots && DB.openSlots[0] ? slotCard(DB.openSlots[0]) : '';

    var dayfoot =
      '<div class="df-item">' + I('note', 'ic-sm') + '<span><b>' + notesDue + '</b> note' + (notesDue === 1 ? '' : 's') + ' unsigned from today</span></div>' +
      '<div class="df-item">' + I('bell', 'ic-sm') + '<span>Reminders sent <b>24 h + 2 h</b> before</span></div>' +
      '<div class="df-item">' + I('shield', 'ic-sm') + '<span>Caseload <b>' + active + ' / 20</b> · full at 20</span><span class="df-bar"><i style="width:' + (active / 20 * 100) + '%"></i></span></div>' +
      '<div class="df-item">' + I('alert', 'ic-sm') + '<span>No late cancellations · policy is 24 h, $75 after</span></div>';

    return '<div class="topbar"><div><h1>Wednesday</h1><div class="sub">30 September 2026 · PT · Free until 1:00 PM</div></div>' +
      '<div class="topbar-actions"><button class="btn btn--soft" data-act="toast" data-msg="Booking link copied to clipboard">' + I('link') + 'Share booking link</button></div></div>' +
      metrics + weekstrip +
      '<div class="sec-head"><span class="label">The daybook</span></div>' +
      '<div class="timeline">' + items + openSlot + '</div>' +
      '<div class="dayfoot">' + dayfoot + '</div>';
  };

  /* ---------- SESSION DETAIL ---------- */

  SCREENS.session = function (entry) {
    var c = DB.get(entry.params.id);
    var item = null, i;
    for (i = 0; i < DB.timeline.length; i++) if (DB.timeline[i].id === c.id) item = DB.timeline[i];
    var st = S.sessionState[c.id];
    var past = item && item.state === 'past';
    var signed = past && (item.note === 'signed' || S.noteSigned[c.id]);
    var draft = NOTE_DRAFT[c.id];

    var strip = '<div style="display:flex;gap:8px;flex-wrap:wrap">';
    strip += st === 'live' ? '<span class="chip chip--live"><span class="dot"></span>In session</span>'
      : st === 'noshow' ? '<span class="chip chip--alert">No-show · fee queued</span>'
      : past ? '<span class="chip ' + (signed ? 'chip--ok' : 'chip--warn') + '">' + (signed ? 'Note signed' : 'Note due') + '</span>'
      : '<span class="chip chip--ok">Confirmed</span>';
    strip += c.insurance.state === 'verified' ? '<span class="chip chip--ok">' + I('shield', 'ic-xs') + 'Coverage verified</span>'
      : c.insurance.state === 'pending' ? '<span class="chip chip--warn">' + I('hourglass', 'ic-xs') + 'Eligibility pending</span>'
      : '<span class="chip">Self-pay</span>';
    strip += '<span class="chip">' + E(c.modality) + '</span></div>';

    var flags = c.flags.map(function (f) {
      return '<div class="flag flag--' + f.tone + '">' + I(f.ic, 'ic-sm') + '<span>' + E(f.text) + '</span></div>';
    }).join('');

    var noteBlock;
    if (draft) {
      noteBlock = '<div class="notebox">' +
        '<div class="nf"><span class="label">Subjective</span><textarea rows="3" placeholder="What they report…">' + E(draft.s) + '</textarea></div>' +
        '<div class="nf"><span class="label">Objective</span><textarea rows="3" placeholder="What you observe…">' + E(draft.o) + '</textarea></div>' +
        '<div class="nf"><span class="label">Plan</span><textarea rows="2" placeholder="Next steps…">' + E(draft.p) + '</textarea></div>' +
        (signed ? '<div class="notestate">' + I('checkCircle', 'ic-sm') + 'Signed · locked to the record</div>' : '') +
        '</div>';
    } else {
      noteBlock = '<div class="notebox">' +
        '<div class="nf"><span class="label">Subjective</span><textarea rows="2" placeholder="What they report…"></textarea></div>' +
        '<div class="nf"><span class="label">Objective</span><textarea rows="2" placeholder="What you observe…"></textarea></div>' +
        '<div class="nf"><span class="label">Plan</span><textarea rows="2" placeholder="Next steps…"></textarea></div>' +
        (signed ? '<div class="notestate">' + I('checkCircle', 'ic-sm') + 'Signed · locked to the record</div>' : '') +
        '</div>';
    }

    var primary;
    if (st === 'live') primary = '<button class="btn btn--primary btn--block" data-act="toast" data-msg="Rejoining the Fairlight video room…">' + I('video') + 'Back to the session</button>';
    else if (past && !signed && draft) primary = '<button class="btn btn--primary btn--block" data-act="sign-note" data-id="' + c.id + '">' + I('stamp') + 'Sign the note</button>';
    else if (past) primary = '<button class="btn btn--soft btn--block" data-act="toast" data-msg="Note opened in the record">' + I('file') + 'Open the note</button>';
    else primary = '<button class="btn btn--primary btn--block" data-act="start-session" data-id="' + c.id + '">' +
      I(c.modality === 'Telehealth' ? 'video' : 'arrowR') + (c.modality === 'Telehealth' ? 'Open the video room' : 'Start the session') + '</button>';

    var docs = [
      { k: 'Intake form', s: c.docs && c.docs.intake ? 'ok' : 'due' },
      { k: 'PHQ-9', s: c.docs && c.docs.phq9 ? 'ok' : 'due' },
      { k: 'Consent', s: c.docs && c.docs.consent ? 'ok' : 'wait' }
    ].map(function (d) {
      var map = { ok: ['ok', 'checkCircle', 'Complete'], due: ['due', 'alert', 'Outstanding'], wait: ['wait', 'hourglass', 'Pending'] };
      var m = map[d.s];
      return '<div class="grow docrow"><span class="gk">' + d.k + '</span><span class="st ' + m[0] + '">' + I(m[1], 'ic-sm') + m[2] + '</span></div>';
    }).join('');

    var history = (c.history || []).map(function (h) {
      return '<div class="hist-item"><span class="d">' + E(h.d) + '</span><span class="n">' + E(h.n) + '</span></div>';
    }).join('');

    return '<div class="sd-head"><div class="sd-head-left">' +
        '<button class="back-btn" data-act="nav" data-nav="today">' + I('chevL') + 'Daybook</button>' +
        AV(c.name, 'ava--xl') +
        '<div><h2>' + E(c.name) + '</h2><div class="pron">' + E(c.pronouns) + ' · client since ' + E(c.since) + '</div></div>' +
      '</div>' +
      '<div class="sd-head-actions">' +
        '<button class="icon-btn" data-act="toast" data-msg="Reminder sent by text">' + I('message', 'ic-sm') + '</button>' +
        '<button class="icon-btn" data-act="reschedule" data-id="' + c.id + '">' + I('repeat', 'ic-sm') + '</button>' +
      '</div></div>' +
      '<div class="sd-grid"><div class="sd-main">' +
        '<div class="card prepcard"><span class="label">Your prep note</span><p>' + E(c.prep) + '</p><div class="by">Written Sun 8:40 PM · only you can see this</div></div>' +
        '<div class="card"><span class="label">Flags</span><div class="flags">' + flags + '</div></div>' +
        '<div class="card"><span class="label">Session note</span>' + noteBlock + '</div>' +
        '<div>' + primary + '</div>' +
      '</div><div class="sd-side">' +
        '<div class="card"><span class="label">Status</span><div style="display:flex;gap:6px;flex-wrap:wrap">' + strip + '</div></div>' +
        '<div class="card"><span class="label">This session</span><div class="statgrid">' +
          '<div class="stat"><div class="label">Type</div><div class="val" style="font-size:14px">' + E(kindLine(c, item, true)) + '</div></div>' +
          '<div class="stat"><div class="label">Coverage</div><div class="val" style="font-size:14px">' + E(insuranceMicro(c)) + '</div></div>' +
        '</div></div>' +
        '<div class="card"><span class="label">Documents</span>' + docs + '</div>' +
        '<div class="card"><span class="label">Recent sessions</span>' + (history || '<p>No prior sessions</p>') + '</div>' +
      '</div></div>';
  };

  /* ---------- CLIENTS ---------- */

  SCREENS.clients = function () {
    var f = S.clientFilter;
    var counts = { all: DB.clients.length, active: 0, intake: 0, waitlist: 0, paused: 0 };
    DB.clients.forEach(function (c) { counts[c.status] = (counts[c.status] || 0) + 1; });

    var filters = '<div class="filters">' +
      [['all', 'All'], ['active', 'Active'], ['intake', 'Intake due'], ['waitlist', 'Waitlist'], ['paused', 'Paused']].map(function (p) {
        return '<button class="fbtn' + (f === p[0] ? ' on' : '') + '" data-act="filter" data-filter="' + p[0] + '">' + p[1] + '<span class="n">' + (counts[p[0]] || 0) + '</span></button>';
      }).join('') + '</div>';

    var list = DB.clients.filter(function (c) {
      if (f === 'all') return true;
      return c.status === f;
    });

    var cards = list.map(function (c) {
      return '<button class="client-card" data-act="open-client" data-id="' + c.id + '">' +
        '<div class="cc-top">' + AV(c.name) +
          '<div><div class="cc-name">' + E(c.name) + '</div><div class="cc-sub">' + E(c.pronouns) + ' · since ' + E(c.since) + '</div></div>' +
          (statusChip(c) ? '<span style="margin-left:auto">' + statusChip(c) + '</span>' : '') +
        '</div>' +
        '<div class="cc-meta"><span class="micro">' + insuranceMicro(c) + '</span><span class="sep"></span><span class="micro">' + E(c.cadence) + '</span></div>' +
        '<div class="cc-slot">' + (c.slot ? 'Standing slot: ' + E(c.slot) : 'No standing slot') + '</div>' +
        '</button>';
    }).join('');

    return '<div class="topbar"><div><h1>Clients</h1><div class="sub">' + DB.clients.length + ' total · ' + counts.active + ' active</div></div></div>' +
      filters +
      (cards ? '<div class="client-grid">' + cards + '</div>' : '<div class="empty">No clients in this view</div>');
  };

  /* ---------- CLIENT RECORD ---------- */

  SCREENS.client = function (entry) {
    var c = DB.get(entry.params.id);
    var st = S.sessionState[c.id];

    var strip = '<div style="display:flex;gap:8px;flex-wrap:wrap">';
    strip += c.status === 'active' ? '<span class="chip chip--ok">Active</span>'
      : c.status === 'intake' ? '<span class="chip chip--warn">Intake due</span>'
      : c.status === 'waitlist' ? '<span class="chip chip--gold">Waitlisted</span>'
      : '<span class="chip">Paused</span>';
    strip += c.insurance.state === 'verified' ? '<span class="chip chip--ok">' + I('shield', 'ic-xs') + 'Coverage verified</span>'
      : c.insurance.state === 'pending' ? '<span class="chip chip--warn">' + I('hourglass', 'ic-xs') + 'Eligibility pending</span>'
      : '<span class="chip">Self-pay</span>';
    strip += '<span class="chip">' + E(c.modality) + '</span></div>';

    var flags = c.flags.map(function (f) {
      return '<div class="flag flag--' + f.tone + '">' + I(f.ic, 'ic-sm') + '<span>' + E(f.text) + '</span></div>';
    }).join('');

    var docs = [
      { k: 'Intake form', s: c.docs && c.docs.intake ? 'ok' : 'due' },
      { k: 'PHQ-9', s: c.docs && c.docs.phq9 ? 'ok' : 'due' },
      { k: 'Consent', s: c.docs && c.docs.consent ? 'ok' : 'wait' }
    ].map(function (d) {
      var map = { ok: ['ok', 'checkCircle', 'Complete'], due: ['due', 'alert', 'Outstanding'], wait: ['wait', 'hourglass', 'Pending'] };
      var m = map[d.s];
      return '<div class="grow docrow"><span class="gk">' + d.k + '</span><span class="st ' + m[0] + '">' + I(m[1], 'ic-sm') + m[2] + '</span></div>';
    }).join('');

    var history = (c.history || []).map(function (h) {
      return '<div class="hist-item"><span class="d">' + E(h.d) + '</span><span class="n">' + E(h.n) + '</span></div>';
    }).join('');

    return '<div class="sd-head"><div class="sd-head-left">' +
        '<button class="back-btn" data-act="nav" data-nav="clients">' + I('chevL') + 'Clients</button>' +
        AV(c.name, 'ava--xl') +
        '<div><h2>' + E(c.name) + '</h2><div class="pron">' + E(c.pronouns) + ' · client since ' + E(c.since) + '</div></div>' +
      '</div>' +
      '<div class="sd-head-actions">' +
        '<button class="icon-btn" data-act="toast" data-msg="Reminder sent by text">' + I('message', 'ic-sm') + '</button>' +
        '<button class="icon-btn" data-act="reschedule" data-id="' + c.id + '">' + I('repeat', 'ic-sm') + '</button>' +
      '</div></div>' +
      '<div class="sd-grid"><div class="sd-main">' +
        '<div class="card prepcard"><span class="label">Your prep note</span><p>' + E(c.prep) + '</p><div class="by">Only you can see this</div></div>' +
        '<div class="card"><span class="label">Flags</span><div class="flags">' + flags + '</div></div>' +
        '<div class="card"><span class="label">Standing slot</span><p>' + (c.slot ? E(c.slot) : 'No standing slot yet') + '</p></div>' +
      '</div><div class="sd-side">' +
        '<div class="card"><span class="label">Status</span><div style="display:flex;gap:6px;flex-wrap:wrap">' + strip + '</div></div>' +
        '<div class="card"><span class="label">Insurance</span><div class="statgrid">' +
          '<div class="stat"><div class="label">Carrier</div><div class="val" style="font-size:14px">' + E(c.insurance.carrier) + '</div></div>' +
          '<div class="stat"><div class="label">Copay</div><div class="val" style="font-size:14px">' + E(c.insurance.copay) + '</div></div>' +
        '</div></div>' +
        '<div class="card"><span class="label">Documents</span>' + docs + '</div>' +
        '<div class="card"><span class="label">Recent sessions</span>' + (history || '<p>No prior sessions</p>') + '</div>' +
      '</div></div>';
  };

  /* ---------- REQUESTS ---------- */

  SCREENS.requests = function () {
    var seg = S.reqSeg;
    var n = { waitlist: DB.clients.filter(function (c) { return c.status === 'waitlist'; }).length };

    var segbar = '<div class="seg">' +
      '<button class="' + (seg === 'requests' ? 'on' : '') + '" data-act="seg" data-seg="requests">Requests <span class="n">' + DB.requests.length + '</span></button>' +
      '<button class="' + (seg === 'waitlist' ? 'on' : '') + '" data-act="seg" data-seg="waitlist">Waitlist <span class="n">' + n.waitlist + '</span></button>' +
      '</div>';

    var body;
    if (seg === 'requests') {
      body = '<div class="req-grid">' + DB.requests.map(function (r) {
        var st = S.reqState[r.id];
        var facts = r.facts.map(function (f) {
          return '<span class="fact fact--' + f.m + '">' + E(f.t) + '</span>';
        }).join('');
        var actions = st === 'accepted'
          ? '<span class="chip chip--ok">Accepted</span>'
          : st === 'sent'
            ? '<span class="chip chip--gold">Offer sent</span>'
            : '<button class="btn btn--primary" data-act="req-accept" data-id="' + r.id + '">' + I('check') + E(r.primary) + '</button>' +
              '<button class="btn btn--quiet" data-act="req-propose" data-id="' + r.id + '">' + I('repeat') + E(r.secondary) + '</button>';
        return '<div class="req-card">' +
          '<div class="rc-head">' + AV(r.name) +
            '<div><div class="rc-name">' + E(r.name) + '</div><div class="rc-kind">' + E(r.kind) + '</div></div>' +
          '</div>' +
          '<div class="rc-ask">' + r.ask + '</div>' +
          '<div class="rc-facts">' + facts + '</div>' +
          '<div class="rc-actions">' + actions + '</div>' +
          '<div class="rc-fit">' + E(r.fit) + '</div>' +
          '</div>';
      }).join('') + '</div>';
    } else {
      body = '<div class="req-grid">' + DB.clients.filter(function (c) { return c.status === 'waitlist'; }).map(function (c) {
        var score = c.wait && c.wait.score ? c.wait.score : 80;
        var criteria = (c.wait && c.wait.criteria ? c.wait.criteria : []).map(function (cr) {
          return '<span class="fact">' + E(cr) + '</span>';
        }).join('');
        return '<div class="mcard">' +
          '<div class="mc-head">' + AV(c.name) +
            '<div><div class="mc-name">' + E(c.name) + '</div><div class="mc-wait">Waiting ' + E(c.wait ? c.wait.waited : '') + '</div></div>' +
            '<span class="mc-score">' + score + '% fit</span>' +
          '</div>' +
          '<div class="mc-criteria">' + criteria + '</div>' +
          '<div class="mc-actions">' +
            '<button class="btn btn--primary" data-act="fill-sheet" data-id="' + c.id + '">' + I('spark') + 'Match the opening</button>' +
          '</div>' +
          '</div>';
      }).join('') + '</div>';
    }

    return '<div class="topbar"><div><h1>Requests</h1><div class="sub">' + (seg === 'requests' ? 'from your booking page' : 'waiting for a gap') + '</div></div></div>' +
      segbar + body;
  };

  /* ---------- BOOKING PAGE ---------- */

  SCREENS.booking = function () {
    var bk = S.bk;

    var visitTypes = [
      { id: 'consult', name: 'Free 15-min consult', dur: 15, desc: 'Phone · fit, practicalities, referrals out if it isn’t right.' },
      { id: 'initial', name: 'Initial session', dur: 60, desc: 'Intake & history · PHQ-9 · treatment plan.' },
      { id: 'return', name: 'Return session', dur: 50, desc: 'Weekly standing slot · video or in-person.' }
    ];

    var vt = '<div class="bk-visit-types">' + visitTypes.map(function (v) {
      return '<button class="bk-vt' + (bk.visit === v.id ? ' on' : '') + '" data-act="bk-visit" data-v="' + v.id + '">' +
        '<div class="vt-name">' + E(v.name) + '</div>' +
        '<div class="vt-dur">' + v.dur + ' min</div>' +
        '<div class="vt-desc">' + E(v.desc) + '</div></button>';
    }).join('') + '</div>';

    var carriers = ['Aetna', 'BCBS', 'United', 'Self-pay'];
    var carrierBtns = '<div class="bk-carriers">' + carriers.map(function (cr) {
      return '<button class="bk-carrier' + (bk.carrier === cr.toLowerCase() ? ' on' : '') + '" data-act="bk-carrier" data-v="' + cr.toLowerCase() + '">' + cr + '</button>';
    }).join('') + '</div>';

    var verifyMsg = '';
    if (bk.verifying) {
      verifyMsg = '<div class="bk-verify-msg" style="background:var(--paper-2);color:var(--ink-2)">Checking eligibility with ' + E(bk.carrier) + '…</div>';
    } else if (bk.verified) {
      verifyMsg = '<div class="bk-verify-msg ok"><b>' + E(bk.carrier) + ' · active.</b> $30 copay per session, deductible met for 2026.</div>';
    } else if (bk.mid) {
      verifyMsg = '<div class="bk-verify-msg err">Member ID ' + E(bk.mid) + ' hasn’t been verified yet.</div>';
    }

    var slots = '';
    if (bk.verified) {
      var days = [
        { d: 'Fri 2 Oct', times: ['10:00 AM', '11:50 AM'] },
        { d: 'Mon 5 Oct', times: ['9:30 AM', '11:00 AM', '4:15 PM'] },
        { d: 'Tue 6 Oct', times: ['1:00 PM', '4:30 PM'] },
        { d: 'Wed 7 Oct', times: ['9:30 AM', '2:00 PM'] }
      ];
      slots = days.map(function (day) {
        return '<div style="margin-bottom:14px"><div class="micro" style="margin-bottom:6px">' + day.d + '</div>' +
          '<div class="bk-slots">' + day.times.map(function (t) {
            var left = t === '10:00 AM' || t === '2:00 PM' ? ' · 1 left' : '';
            return '<button class="bk-slot' + (bk.slot === day.d + '|' + t ? ' on' : '') + '" data-act="bk-slot" data-v="' + day.d + '|' + t + '">' + t + '<span class="left">' + left + '</span></button>';
          }).join('') + '</div></div>';
      }).join('');
    }

    var concerns = ['Anxiety', 'Low mood', 'Work & burnout', 'Sleep', 'Relationships', 'Grief'];
    var concernBtns = '<div class="bk-concerns">' + concerns.map(function (c) {
      return '<button class="bk-concern' + (bk.concerns.indexOf(c) >= 0 ? ' on' : '') + '" data-act="bk-concern" data-v="' + c + '">' + c + '</button>';
    }).join('') + '</div>';

    var price = bk.verified ? '$30' : '$185';
    var priceNote = bk.verified ? 'copay · ' + bk.carrier : 'verify to see your copay';

    var foot = '<div class="bk-foot"><div class="bk-price">' + E(bk.visit.replace(/^\w/, function (m) { return m.toUpperCase(); })) + ' · 60 MIN<span class="amt">' + price + ' <span style="font-size:13px;font-weight:400;color:var(--ink-3)">' + priceNote + '</span></span></div>' +
      '<button class="btn btn--primary btn--lg" data-act="bk-submit"' + (!bk.policy || !bk.slot ? ' disabled' : '') + '>Request this time</button></div>';

    if (bk.done) {
      return '<div class="bk-wrap"><div class="bk-success">' +
        '<div class="check-big">' + I('check') + '</div>' +
        '<h2>You’re booked</h2>' +
        '<div class="when">Fri 2 Oct · 10:00 AM · Initial session with Naomi Okafor</div>' +
        '<div class="details">' +
          '<div class="row">' + I('checkCircle') + 'Aetna verified — $30 copay · deductible met</div>' +
          '<div class="row">' + I('checkCircle') + 'Intake + PHQ-9 — texted to (503) 555-0148 · takes ~6 min</div>' +
          '<div class="row">' + I('checkCircle') + 'Video link — opens 10 minutes before, no app needed</div>' +
          '<div class="row">' + I('checkCircle') + '24-hour policy — late cancellations bill $75</div>' +
        '</div>' +
        '<button class="btn btn--soft" data-act="bk-reset">Book another time</button>' +
        '<p style="margin-top:20px;font-size:13px;color:var(--ink-3)">Not for emergencies — call or text 988, or go to your nearest ER.</p>' +
        '</div></div>';
    }

    return '<div class="bk-wrap">' +
      '<div class="bk-hero"><h1>Booking page</h1><div class="sub">Fairlight · Public link</div>' +
      '<div class="desc">Naomi Okafor, LMFT · OR #T-114821 · Portland, OR · telehealth across Oregon</div></div>' +

      '<div class="bk-card"><div class="bk-step"><span class="n">1</span>What kind of session</div>' +
        '<div class="micro" style="margin-bottom:10px">CLINICAL, NOT GENERIC</div>' + vt + '</div>' +

      '<div class="bk-card"><div class="bk-step"><span class="n">2</span>How you’re paying</div>' +
        '<div class="micro" style="margin-bottom:10px">CHECKED BEFORE YOU BOOK</div>' +
        carrierBtns +
        '<div class="bk-verify-row"><input class="bk-input" id="memberId" placeholder="Member ID" value="' + E(bk.mid || '') + '">' +
        '<button class="btn btn--soft" data-act="bk-verify">' + I('shield') + 'Verify</button></div>' +
        verifyMsg + '</div>' +

      (bk.verified ? '<div class="bk-card"><div class="bk-step"><span class="n">3</span>Pick a time</div>' +
        '<div class="micro" style="margin-bottom:10px">ONLY THE SLOTS THAT FIT THIS VISIT TYPE</div>' + slots + '</div>' : '') +

      '<div class="bk-card"><div class="bk-step"><span class="n">4</span>A bit about you</div>' +
        '<div class="micro" style="margin-bottom:10px">GOES TO NAOMI, NOT A CRM</div>' +
        '<div class="micro" style="margin-bottom:6px">WHAT WOULD YOU LIKE HELP WITH?</div>' + concernBtns +
        '<div class="micro" style="margin:14px 0 6px">PRIOR THERAPY?</div>' +
        '<div class="bk-concerns">' +
          '<button class="bk-concern' + (bk.prior === 'yes' ? ' on' : '') + '" data-act="bk-prior" data-v="yes">Yes</button>' +
          '<button class="bk-concern' + (bk.prior === 'no' ? ' on' : '') + '" data-act="bk-prior" data-v="no">No</button>' +
        '</div></div>' +

      '<div class="bk-card"><div class="bk-step"><span class="n">5</span>Policy</div>' +
        '<div class="bk-policy' + (bk.policy ? ' on' : '') + '" data-act="bk-policy">' +
          '<span class="check">' + (bk.policy ? I('check') : '') + '</span>' +
          '<span>24-hour cancellation policy. Cancelling or moving less than 24 hours ahead costs $75, and your insurance won’t pay for a missed visit — no charge if you give a day’s notice.</span>' +
        '</div></div>' +

      foot +
      '</div>';
  };

})();
