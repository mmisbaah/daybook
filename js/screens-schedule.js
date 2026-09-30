/* ============================================================
   DAYBOOK — screens: the daybook (today) + session detail
   ============================================================ */

var SCREENS = {};

(function () {
  'use strict';
  var I = UI.icon, E = UI.esc, AV = UI.ava;

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
      noteRow = '<div class="scard-note">' + I('video', 'ic-sm') + '<span>Waiting room open — Marisol joined 40 seconds ago.</span></div>';
    } else if (st === 'noshow') {
      noteRow = '<div class="scard-note">' + I('alert', 'ic-sm') + '<span>Marked no-show at 3:04 PM. Policy fee $75 queued for the invoice.</span></div>';
    } else if (item.state === 'past') {
      var signed = item.note === 'signed' || S.noteSigned[c.id];
      noteRow = signed
        ? '<div class="scard-note">' + I('checkCircle', 'ic-sm') + '<span>Note signed · ready for the record.</span></div>'
        : '<div class="scard-note">' + I('note', 'ic-sm') + '<span><b>Session note not started.</b> Sign it before tomorrow 9:00 AM.</span></div>';
    } else {
      noteRow = '<div class="scard-note">' + I('spark', 'ic-sm') + '<span>' + c.prep + '</span></div>';
    }

    var chipTxt = statusChip(c, item);
    var cadence = chipTxt
      ? c.cadence.toUpperCase()
      : c.cadence.toUpperCase() + ' · SINCE ' + c.since.toUpperCase();

    return '<button type="button" class="' + cls + '" style="--edge:' + modalityEdge(c.modality) + '" ' +
      'data-act="push" data-screen="session" data-id="' + c.id + '">' +
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
    return '<button type="button" class="scard" style="--edge:var(--gold)" data-act="toast" data-msg="Group roster · 5 of 6 attending">' +
      '<span class="scard-top">' +
        '<span class="ava" style="--tone:#EFE4C8">' + I('users', 'ic-sm') + '</span>' +
        '<span class="scard-id"><h4>' + E(g.text) + '</h4><p>' + g.seats + ' seats · ' + g.attending + ' attending · ' + g.dur + ' · Room 2</p></span>' +
        '<span class="chip chip--warn">Group</span>' +
      '</span>' +
      '<span class="scard-foot"><span style="display:flex;align-items:center;gap:4px">' + chips +
        '<span class="micro" style="margin-left:8px">1 SEAT OPEN</span></span></span>' +
      '<span class="scard-note">' + I('repeat', 'ic-sm') + '<span>Six-week cycle, week 4 of 6. Bring the fear-ladder handout for anyone who missed week 3.</span></span>' +
      '</button>';
  }

  function slotCard(g) {
    var filledId = S.filled[g.id];
    if (filledId) {
      var c = DB.get(filledId);
      return '<button type="button" class="scard slot--filled just-filled" style="--edge:var(--pine)" ' +
        'data-act="push" data-screen="session" data-id="' + c.id + '">' +
        '<span class="stamp">Filled</span>' +
        '<span class="scard-top">' + AV(c.name) +
          '<span class="scard-id"><h4>' + E(c.name) + '</h4><p>' + modIcon('Telehealth') + 'First session · 60 min</p></span>' +
        '</span>' +
        '<span class="scard-foot">' +
          '<span class="micro">AETNA · $30</span><span class="sep"></span>' +
          '<span class="micro">WEEKLY · WAITED 6 DAYS</span>' +
        '</span>' +
        '<span class="scard-note">' + I('checkCircle', 'ic-sm') +
        '<span>Intake + PHQ-9 already returned. Welcome link and consent sent to (503) 555-0121.</span></span>' +
        '</button>';
    }
    var matches = DB.clients.filter(function (c) {
      return c.status === 'waitlist' && c.wait && c.wait.match >= 65;
    }).length;
    return '<button type="button" class="slot" data-act="fill-sheet" data-id="' + g.id + '">' +
      '<span class="slot-h"><span class="t">1:00 PM · open</span>' +
      '<span class="micro">' + E(g.dur.toUpperCase()) + ' · ' + E(g.modality.toUpperCase()) + '</span></span>' +
      '<span class="slot-meta">Freed up last night when the 1:00 hold was released. Nobody has been offered it yet.</span>' +
      '<span class="slot-cta">' + I('spark', 'ic-sm') + 'Match from the waitlist <span class="n">' + matches + ' CANDIDATES</span></span>' +
      '</button>';
  }

  /* ---------------- Today ---------------- */
  SCREENS.today = function () {
    var openings = DB.timeline.filter(function (g) { return g.kind === 'slot' && !S.filled[g.id]; }).length;
    var notesDue = DB.timeline.filter(function (g) {
      return g.kind === 'session' && g.state === 'past' && g.note !== 'signed' && !S.noteSigned[g.id];
    }).length;

    var metrics = '<div class="metrics">' +
      '<span class="metric"><b>' + DB.practice.caseload + '</b> active</span>' +
      '<span class="metric metric--open"><b>' + openings + '</b> opening' + (openings === 1 ? '' : 's') + '</span>' +
      (notesDue ? '<span class="metric metric--due"><b>' + notesDue + '</b> note due</span>' : '') +
      '<span class="metric"><b>2</b> intake due</span>' +
      '</div>';

    var week = '<div class="week">' + DB.week.map(function (d) {
      var on = d.today, pct = Math.round((d.load / 7) * 100);
      return '<button type="button" class="day' + (on ? ' on today' : '') + (d.full ? ' full' : '') + '" ' +
        'data-act="toast" data-msg="' + d.d + ' ' + d.n + ' · ' + d.load + ' sessions">' +
        '<span class="dw">' + d.d + '</span><span class="dn">' + d.n + '</span>' +
        '<span class="load"><i style="width:' + (d.load ? Math.max(pct, 12) : 0) + '%"></i></span></button>';
    }).join('') + '</div>';

    var rows = DB.timeline.map(function (g, i) {
      var time = '<div class="tl-t">' + g.t + '<span class="mer">' + g.mer + '</span></div>';
      var body = '';

      if (g.kind === 'now') {
        body = '<div class="tl-c"><div class="nowline"><span class="nl">NOW · 12:38 PM</span><span class="bar"></span>' +
          '<span class="nl" style="color:var(--ink-3)">LUNCH 12:45</span></div></div>';
        return '<div class="tl-row is-now stg" style="--i:' + i + '">' + time + body + '</div>';
      }
      if (g.kind === 'block') {
        body = '<div class="tl-c"><div class="blockrow">' + I('note', 'ic-sm') +
          '<span>' + E(g.text) + '</span><span class="micro">' + E(g.dur) + '</span></div></div>';
      } else if (g.kind === 'slot') {
        body = '<div class="tl-c">' + slotCard(g) + '</div>';
      } else if (g.kind === 'group') {
        body = '<div class="tl-c">' + groupCard(g) + '</div>';
      } else {
        var c = DB.get(g.id);
        body = '<div class="tl-c">' + sessionCard(c, g) + '</div>';
      }
      var past = g.state === 'past' ? ' is-past' : '';
      return '<div class="tl-row' + past + ' stg" style="--i:' + i + '">' + time + body + '</div>';
    }).join('');

    return '<div class="scr-body">' +
      '<div class="mast">' +
        '<div><div class="mast-practice"><b>FAIRLIGHT</b> / COUNSELING · ' + E(DB.practice.city.toUpperCase()) + '</div>' +
        '<h1>Wednesday</h1><div class="date">30 September 2026 · ' + E(DB.practice.tz) + ' · free until 1:00</div></div>' +
        '<div class="mast-right">' + AV('Naomi Okafor', 'ava--lg') + '</div>' +
      '</div>' + metrics + week +
      '<div class="sec-head"><span class="label">The daybook</span>' +
      '<span class="link" data-act="tab" data-tab="booking">Share booking link</span></div>' +
      '<div class="tl">' + rows + '</div>' +
      '<div class="dayfoot">' +
        '<div class="r">' + I('note', 'ic-sm') + '<span>' + (notesDue ? '<b>' + notesDue + ' note unsigned</b> from this morning' : '<b>All notes signed</b> — nothing hanging over') + '</span></div>' +
        '<div class="r">' + I('bell', 'ic-sm') + '<span>Reminders sent <b>24 h + 2 h</b> before · 6 delivered today</span></div>' +
        '<div class="r">' + I('shield', 'ic-sm') + '<span>Caseload <b>' + DB.practice.caseload + ' / ' + DB.practice.cap + '</b> · full at 20</span>' +
          '<span style="flex:1;height:5px;border-radius:9px;background:var(--line);overflow:hidden;max-width:96px">' +
          '<i style="display:block;height:100%;width:' + Math.round(DB.practice.caseload / DB.practice.cap * 100) + '%;background:var(--pine);border-radius:9px"></i></span></div>' +
        '<div class="r">' + I('alert', 'ic-sm') + '<span>No late cancellations today · policy is 24 h, $75 after</span></div>' +
      '</div>' +
      '</div>';
  };

  /* ---------------- Session detail ---------------- */
  var NOTE_DRAFT = {
    marisol: {
      s: 'Reports 3 nights of broken sleep since the start date; denies napping. “The role is fine — it’s the 6 a.m. cortisol that isn’t.”',
      o: 'Alert, oriented, linear thought. Affect brighter than 9 Sep. Denied SI/HI. Sleep log returned with 4/7 disrupted nights.',
      p: 'Continue weekly. Stimulus-control check-in next week; wind-down window 9:30 pm. Re-run PHQ-9 on Oct 14.'
    },
    priya: {
      s: 'Container held between sessions; one intrusive image of the corridor on Sunday but it passed without ritual.',
      o: 'Grounded, oriented to room. SUDS 4 at check-in. No dissociation during bilateral set.',
      p: 'Phase 3 complete — move to future template next week.'
    }
  };

  function docRow(key, label, state) {
    var map = {
      ok:   { cls: 'ok',   ic: 'checkCircle', t: 'Complete' },
      due:  { cls: 'due',  ic: 'alert',       t: 'Outstanding' },
      wait: { cls: 'wait', ic: 'hourglass',   t: 'Pending' }
    };
    var m = map[state] || map.wait;
    return '<div class="grow docrow"><span class="gk">' + label + '</span>' +
      '<span class="st ' + m.cls + '">' + I(m.ic, 'ic-sm') + m.t + '</span></div>';
  }

  SCREENS.session = function (entry) {
    var c = DB.get(entry.params.id);
    var item = null, i;
    for (i = 0; i < DB.timeline.length; i++) if (DB.timeline[i].id === c.id) item = DB.timeline[i];
    var st = S.sessionState[c.id];
    var past = item && item.state === 'past';
    var signed = past && (item.note === 'signed' || S.noteSigned[c.id]);
    var draft = NOTE_DRAFT[c.id];

    /* status strip */
    var strip = '<div class="metrics">';
    strip += st === 'live' ? '<span class="chip chip--live"><span class="dot"></span>In session</span>'
      : st === 'noshow' ? '<span class="chip chip--alert">No-show · fee queued</span>'
      : past ? '<span class="chip ' + (signed ? 'chip--ok' : 'chip--warn') + '">' + (signed ? 'Note signed' : 'Note due') + '</span>'
      : '<span class="chip chip--ok">Confirmed</span>';
    strip += c.insurance.state === 'verified' ? '<span class="chip chip--ok">' + I('shield', 'ic-xs') + 'Coverage verified</span>'
      : c.insurance.state === 'pending' ? '<span class="chip chip--warn">' + I('hourglass', 'ic-xs') + 'Eligibility pending</span>'
      : '<span class="chip">Self-pay</span>';
    strip += '<span class="chip">' + E(c.modality) + '</span>';
    strip += '</div>';

    /* flags */
    var flags = c.flags.map(function (f) {
      return '<div class="flag flag--' + f.tone + '">' + I(f.ic, 'ic-sm') + '<span>' + f.text + '</span></div>';
    }).join('');

    /* note editor */
    var noteBlock;
    if (draft) {
      noteBlock = '<div class="notebox">' +
        '<div class="nf"><span class="label">Subjective</span><textarea rows="3" placeholder="What they report…">' + E(draft.s) + '</textarea></div>' +
        '<div class="nf"><span class="label">Objective</span><textarea rows="3" placeholder="What you observe…">' + E(draft.o) + '</textarea></div>' +
        '<div class="nf"><span class="label">Plan</span><textarea rows="2" placeholder="Next steps…">' + E(draft.p) + '</textarea></div>' +
        (signed ? '<div class="notestate">' + I('checkCircle', 'ic-sm') + 'Signed 12:31 PM · locked to the record</div>' : '') +
        '</div>';
    } else {
      noteBlock = '<div class="notebox">' +
        '<div class="nf"><span class="label">Subjective</span><textarea rows="2" placeholder="What they report…"></textarea></div>' +
        '<div class="nf"><span class="label">Objective</span><textarea rows="2" placeholder="What you observe…"></textarea></div>' +
        '<div class="nf"><span class="label">Plan</span><textarea rows="2" placeholder="Next steps…"></textarea></div>' +
        (signed ? '<div class="notestate">' + I('checkCircle', 'ic-sm') + 'Signed ' + (c.id === 'dev' ? '11:12 AM' : 'earlier') + ' · locked to the record</div>' : '') +
        '</div>';
    }

    var primary;
    if (st === 'live') primary = '<button class="btn btn--primary btn--block" data-act="toast" data-msg="Rejoining the Fairlight video room…">' + I('video') + 'Back to the session</button>';
    else if (past && !signed && draft) primary = '<button class="btn btn--primary btn--block" data-act="sign-note" data-id="' + c.id + '">' + I('stamp') + 'Sign the note</button>';
    else if (past) primary = '<button class="btn btn--soft btn--block" data-act="toast" data-msg="Note opened in the record">' + I('file') + 'Open the note</button>';
    else primary = '<button class="btn btn--primary btn--block" data-act="start-session" data-id="' + c.id + '">' +
      I(c.modality === 'Telehealth' ? 'video' : 'arrowR') + (c.modality === 'Telehealth' ? 'Open the video room' : 'Start the session') + '</button>';

    return '<div class="scr-nav"><button class="back-btn" data-act="back">' + I('chevL') + 'Daybook</button>' +
        '<div class="nav-actions">' +
        '<button class="icon-btn" data-act="toast" data-msg="Reminder sent by text to ' + E(c.contact.split('· ').pop()) + '">' + I('message', 'ic-sm') + '</button>' +
        '<button class="icon-btn" data-act="reschedule" data-id="' + c.id + '">' + I('repeat', 'ic-sm') + '</button>' +
        '</div></div>' +
      '<div class="scr-body">' +
        '<div class="dhead">' + AV(c.name, 'ava--xl') +
          '<div class="who"><span class="pron">' + E(c.pronouns) + ' · client since ' + E(c.since) + '</span>' +
          '<h3>' + E(c.name) + '</h3>' +
          '<div class="sub">' + E(kindLine(c, item, true)) + '</div></div>' +
        '</div>' + strip +
        '<div class="sec-head"><span class="label">Before you start</span></div>' +
        '<div class="prepcard"><span class="label">Your prep note</span><p>' + E(c.prep) + '</p>' +
          '<div class="by">Written Sun 8:40 PM · only you can see this</div></div>' +
        flags +
        '<div class="statgrid" style="margin-bottom:4px">' +
          '<div class="stat"><div class="k">Cadence</div><div class="v">' + E(c.cadence.split(' ')[0]) + '<small>' + (c.cadence.split(' ')[1] || '') + '</small></div></div>' +
          '<div class="stat"><div class="k">Next</div><div class="v">' + E(c.next.split(',')[0]) + '<small>' + E(c.next.split(',').slice(1).join(',').trim()) + '</small></div></div>' +
          '<div class="stat"><div class="k">Last</div><div class="v">' + E(c.last) + '</div></div>' +
          '<div class="stat"><div class="k">Due</div><div class="v">' + E(c.insurance.copay) + '</div></div>' +
        '</div>' +

        '<div class="sec-head"><span class="label">Clinical snapshot</span><span class="link" data-act="push" data-screen="client" data-id="' + c.id + '">Full record</span></div>' +
        '<div class="group group--inset">' +
          '<div class="grow"><span class="gk">Coverage</span><span class="gv">' + E(c.insurance.carrier) +
            (c.insurance.state === 'verified' ? ' · verified' : c.insurance.state === 'pending' ? ' · pending' : '') +
            '<span class="s">' + E(c.insurance.member) + '</span></span></div>' +
          '<div class="grow"><span class="gk">Standing slot</span><span class="gv">' + E(c.slotLong) + '</span></div>' +
          docRow('intake', 'Intake + history form', c.docs.intake) +
          docRow('consent', 'Informed consent', c.docs.consent) +
          docRow('phq9', 'PHQ-9 / GAD-7 measures', c.docs.phq9) +
        '</div>' +
        '<div class="tags" style="padding-top:12px">' + c.focus.map(function (f) {
          return '<span class="tag">' + E(f) + '</span>';
        }).join('') + '</div>' +

        '<div class="sec-head"><span class="label">Session note</span><span class="micro">SOAP · auto-saved</span></div>' +
        noteBlock +

        '<div class="sec-head"><span class="label">Recent sessions</span><span class="micro">' + c.history.length + ' on file</span></div>' +
        (c.history.length
          ? '<ul class="hist">' + c.history.map(function (h) {
              return '<li><span class="hd">' + E(h.d) + '</span><span class="bd"><p>' + E(h.t) + '</p>' +
                '<p class="m">' + E(h.m) + '</p></span></li>';
            }).join('') + '</ul>'
          : '<div class="empty">' + I('file') + '<p>No completed sessions yet — this is the first one on the record.</p></div>') +

        '<div class="actionbar">' + primary +
          '<button class="btn btn--soft" data-act="reschedule" data-id="' + c.id + '">Reschedule</button></div>' +
        '<div class="stack-actions">' +
          (past ? '' : '<button class="btn btn--quiet btn--block btn--sm" data-act="noshow" data-id="' + c.id + '">Mark as no-show</button>') +
        '</div>' +
        '<div class="dayfoot" style="margin-top:8px">' +
          '<div class="r">' + I('shield', 'ic-sm') + '<span>Cancellation policy: <b>24 hours</b>’ notice. After that ' +
          (c.insurance.state === 'self' ? '$75' : 'the visit isn’t billable and the copay still applies') + '.</span></div>' +
          '<div class="r">' + I('phone', 'ic-sm') + '<span>' + E(c.contact) + '</span></div>' +
        '</div>' +
      '</div>';
  };
})();
