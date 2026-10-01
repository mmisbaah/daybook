/* ============================================================
   DAYBOOK — screens: client roster, client record,
   requests + waitlist matching
   ============================================================ */

(function () {
  'use strict';
  var I = UI.icon, E = UI.esc, AV = UI.ava;

  var DOT = { active: 'pine', intake: 'gold', waitlist: 'clay', paused: 'grey' };
  var LB  = { active: 'Active', intake: 'Intake due', waitlist: 'Waitlist', paused: 'Paused' };

  function counts() {
    var c = { all: DB.clients.length, active: 0, waitlist: 0, intake: 0, paused: 0 };
    DB.clients.forEach(function (x) { c[x.status]++; });
    c.caseload = c.active + c.intake + c.paused;
    return c;
  }

  /* ---------------- Client roster ---------------- */
  SCREENS.clients = function () {
    var n = counts();
    var f = S.clientFilter;
    var list = DB.clients.filter(function (c) { return f === 'all' || c.status === f; });

    var filters = [
      { id: 'all', t: 'All', n: n.all },
      { id: 'active', t: 'Active', n: n.active },
      { id: 'waitlist', t: 'Waitlist', n: n.waitlist },
      { id: 'intake', t: 'Intake due', n: n.intake },
      { id: 'paused', t: 'Paused', n: n.paused }
    ].map(function (x) {
      return '<button type="button" class="fchip' + (f === x.id ? ' on' : '') + '" data-act="filter" data-filter="' + x.id + '">' +
        E(x.t) + '<span class="n">' + x.n + '</span></button>';
    }).join('');

    var rows = list.map(function (c, i) {
      return '<button type="button" class="listrow stg" style="--i:' + Math.min(i, 8) + '" data-act="push" data-screen="client" data-id="' + c.id + '">' +
        AV(c.name) +
        '<span class="lmain"><h4>' + E(c.name) + '</h4>' +
        '<p>' + E(c.cadence + ' · ' + c.slot + ' · ' + c.modality) + '</p></span>' +
        '<span class="lside"><span class="d">' + E(c.next) + '</span>' +
        '<span class="sdot sdot--' + DOT[c.status] + '"></span></span></button>';
    }).join('');

    return '<div class="scr-topbar"><div><h2>Clients</h2>' +
        '<div class="sub">' + n.caseload + ' on the books · ' + n.waitlist + ' waitlisted</div></div>' +
        '<div class="nav-actions">' +
        '<button class="icon-btn" data-act="toast" data-msg="Search by name, carrier or slot">' + I('search', 'ic-sm') + '</button>' +
        '<button class="icon-btn" data-db="new-client" aria-label="Add client">' + I('plus', 'ic-sm') + '</button>' +
        '</div></div>' +
      '<div class="scr-body">' +
        '<div class="filters">' + filters + '</div>' +
        '<div class="sec-head"><span class="label">' + (f === 'all' ? 'In order of next session' : LB[f]) + '</span>' +
        '<span class="micro">' + list.length + ' shown</span></div>' +
        '<div class="group group--inset">' + (rows || '<div class="empty">' + I('users') + '<p>Nobody in this state right now.</p></div>') + '</div>' +
        '<div class="dayfoot">' +
          '<div class="r">' + I('spark', 'ic-sm') + '<span>Waitlist auto-fills cancellations when a client books from <b>your link</b>.</span></div>' +
        '</div>' +
      '</div>';
  };

  /* ---------------- Client record ---------------- */
  SCREENS.client = function (entry) {
    var c = DB.get(entry.params.id);
    var n = counts();
    var w = c.wait;

    var flags = c.flags.map(function (f) {
      return '<div class="flag flag--' + f.tone + '">' + I(f.ic, 'ic-sm') + '<span>' + f.text + '</span></div>';
    }).join('');

    var docs = [
      { k: 'intake', t: 'Intake + history form', s: c.docs.intake },
      { k: 'consent', t: 'Informed consent', s: c.docs.consent },
      { k: 'phq9', t: 'PHQ-9 / GAD-7 measures', s: c.docs.phq9 }
    ].map(function (d) {
      var m = { ok: ['ok', 'checkCircle', 'Complete'], due: ['due', 'alert', 'Outstanding'], wait: ['wait', 'hourglass', 'Pending'] }[d.s] || ['wait', 'hourglass', 'Pending'];
      return '<div class="grow docrow"><span class="gk">' + d.t + '</span>' +
        '<span class="st ' + m[0] + '">' + I(m[1], 'ic-sm') + m[2] + '</span></div>';
    }).join('');

    var covLine = c.insurance.state === 'verified' ? 'Verified · ' + c.insurance.copay + ' copay'
      : c.insurance.state === 'pending' ? 'Eligibility pending' : 'Self-pay';

    return '<div class="scr-nav"><button class="back-btn" data-act="back">' + I('chevL') + 'Clients</button>' +
        '<div class="nav-actions">' +
        '<button class="icon-btn" data-act="toast" data-msg="Text drafted to ' + E(c.name.split(' ')[0]) + '">' + I('message', 'ic-sm') + '</button>' +
        '<button class="icon-btn" data-act="toast" data-msg="Client record is read-only in demo mode">' + I('note', 'ic-sm') + '</button>' +
        '</div></div>' +
      '<div class="scr-body">' +
        '<div class="dhead">' + AV(c.name, 'ava--xl') +
          '<div class="who"><span class="pron">' + E(c.pronouns) + ' · ' + E(LB[c.status]) + ' · since ' + E(c.since) + '</span>' +
          '<h3>' + E(c.name) + '</h3>' +
          '<div class="sub">' + E(c.slotLong + ' · ' + c.modality) + '</div></div>' +
        '</div>' +
        '<div class="metrics">' +
          '<span class="chip ' + (c.status === 'waitlist' ? 'chip--alert' : c.status === 'paused' ? '' : 'chip--ok') + '">' + E(LB[c.status]) + '</span>' +
          '<span class="chip">' + E(c.cadence) + '</span>' +
          '<span class="chip ' + (c.insurance.state === 'verified' ? 'chip--ok' : c.insurance.state === 'pending' ? 'chip--warn' : '') + '">' + E(c.insurance.carrier) + ' · ' + E(covLine) + '</span>' +
        '</div>' +
        flags +

        (c.wait
          ? '<div class="fillbanner" style="background:var(--card);border-style:solid;border-color:var(--line)">' +
              '<div class="fh">' + I('hourglass', 'ic-sm') + '<h4>Waitlisted ' + E(c.wait.waited) + '</h4></div>' +
              '<p style="color:var(--ink-2)">Looking for <b>' + E(c.wait.window) + '</b>. Match score against today’s opening: <b>' + c.wait.match + '%</b>.</p>' +
            '</div>'
          : '<div class="standing">' + I('repeat', 'ic-sm') +
              '<span class="st"><b>' + E(c.slotLong) + ' · held</b>' +
              '<span>Standing slot reserved through 30 Dec · released automatically if cadence breaks</span></span>' +
            '</div>') +

        '<div class="statgrid">' +
          '<div class="stat"><div class="k">Cadence</div><div class="v">' + E(c.cadence.split(' ')[0]) + '<small>' + E(c.cadence.split(' ')[1] || '') + '</small></div></div>' +
          '<div class="stat"><div class="k">Next</div><div class="v">' + E(c.next.split(',')[0]) + '<small>' + E(c.next.split(',').slice(1).join(',').trim() || '—') + '</small></div></div>' +
          '<div class="stat"><div class="k">Last</div><div class="v">' + E(c.last) + '</div></div>' +
          '<div class="stat"><div class="k">Balance</div><div class="v">' + E(c.balance) + '</div></div>' +
        '</div>' +

        '<div class="sec-head"><span class="label">Coverage</span><span class="link" data-act="toast" data-msg="Re-checked against the payer · 0.8s">Re-verify</span></div>' +
        '<div class="group group--inset">' +
          '<div class="grow"><span class="gk">Plan</span><span class="gv">' + E(c.insurance.carrier) + '<span class="s">' + E(c.insurance.member) + '</span></span></div>' +
          '<div class="grow"><span class="gk">Copay</span><span class="gv">' + E(c.insurance.copay) + ' per session</span></div>' +
          '<div class="grow"><span class="gk">Balance</span><span class="gv">' + E(c.balance) + '</span></div>' +
        '</div>' +

        '<div class="sec-head"><span class="label">Documents</span><span class="micro">HIPAA release on file</span></div>' +
        '<div class="group group--inset">' + docs + '</div>' +

        '<div class="sec-head"><span class="label">Measures</span><span class="micro">' + E(c.scores.trend) + '</span></div>' +
        '<div class="statgrid">' +
          '<div class="stat" style="grid-column:span 2"><div class="k">PHQ-9 depression</div><div class="v">' + E(c.scores.phq) + '</div></div>' +
          '<div class="stat" style="grid-column:span 2"><div class="k">GAD-7 anxiety</div><div class="v">' + E(c.scores.gad) + '</div></div>' +
        '</div>' +

        '<div class="sec-head"><span class="label">Contact</span></div>' +
        '<div class="group group--inset">' +
          '<div class="grow"><span class="gk">Preferred</span><span class="gv">' + E(c.contact) + '</span></div>' +
          '<div class="grow"><span class="gk">Reminders</span><span class="gv">24 h + 2 h<span class="s">by text, opt-out honoured</span></span></div>' +
          '<div class="grow"><span class="gk">Timezone</span><span class="gv">Pacific · ' + E(DB.practice.tz) + '</span></div>' +
        '</div>' +

        '<div class="sec-head"><span class="label">Treatment focus</span></div>' +
        '<div class="tags">' + c.focus.map(function (f) { return '<span class="tag">' + E(f) + '</span>'; }).join('') + '</div>' +

        '<div class="sec-head"><span class="label">Session history</span><span class="micro">' + c.history.length + ' notes</span></div>' +
        (c.history.length
          ? '<ul class="hist">' + c.history.map(function (h) {
              return '<li><span class="hd">' + E(h.d) + '</span><span class="bd"><p>' + E(h.t) + '</p><p class="m">' + E(h.m) + '</p></span></li>';
            }).join('') + '</ul>'
          : '<div class="empty">' + I('file') + '<p>Nothing on file yet. Notes appear here the moment you sign them.</p></div>') +

        '<div class="actionbar">' +
          '<button class="btn btn--primary" data-act="toast" data-msg="Next ' + E(c.cadence.toLowerCase()) + ' slot held on ' + E(c.slot) + '">' + I('calendarDot') + 'Book next</button>' +
          '<button class="btn btn--soft" data-act="reschedule" data-id="' + c.id + '">Move slot</button>' +
        '</div>' +
        '<div class="stack-actions">' +
          '<button class="btn btn--quiet btn--block btn--sm" data-act="toast" data-msg="Cadence paused — slot released to the waitlist">Pause cadence</button>' +
        '</div>' +
        '<div class="dayfoot">' +
          '<div class="r">' + I('shield', 'ic-sm') + '<span>Record access logged · ' + n.caseload + ' clients · ' + E(DB.practice.license) + '</span></div>' +
        '</div>' +
      '</div>';
  };

  /* ---------------- Waitlist match card (also used in the sheet) ---------------- */
  function matchCard(c, opts) {
    opts = opts || {};
    var w = c.wait;
    var booked = S.filledBy[c.id];
    var out = !opts.offerable || booked;
    var crit = w.reasons.map(function (r) {
      return '<span class="c' + (r.ok ? '' : ' no') + '"><span class="bx">' +
        I(r.ok ? 'check' : 'x', 'ic-xs') + '</span><span>' + r.t + '</span></span>';
    }).join('');

    return '<div class="matchcard ' + (out ? 'is-out' : 'is-top') + (opts.stg ? ' stg' : '') + '"' +
      (opts.stg ? ' style="--i:' + opts.i + '"' : '') + '>' +
      '<div class="mh">' +
        '<span class="score" style="--p:' + w.match + '"><span>' + w.match + '</span></span>' +
        '<span class="who"><h4>' + E(c.name) + '</h4>' +
        '<span class="sub">' + E(w.window) + ' · waiting ' + E(w.waited) + '</span></span>' +
        (booked ? '<span class="chip chip--ok">Booked</span>' : '<span class="chip ' + (w.match >= 85 ? 'chip--ok' : w.match >= 60 ? 'chip--warn' : '') + '">' + w.match + '% fit</span>') +
      '</div>' +
      '<span class="crit">' + crit + '</span>' +
      (out && !booked
        ? '<div class="notfit">' + I('alert', 'ic-sm') + '<span>Not offered this opening — they stay on the list for the next one that fits.</span></div>'
        : booked
          ? '<div class="notfit">' + I('checkCircle', 'ic-sm') + '<span>Booked into today’s 1:00 PM opening · welcome text and consent sent.</span></div>'
          : '<div class="mact">' +
              '<button class="btn btn--primary btn--sm" data-act="fill-confirm" data-id="' + c.id + '">Offer 1:00 PM</button>' +
              '<button class="btn btn--soft btn--sm" data-act="toast" data-msg="Text drafted to ' + E(c.name.split(' ')[0]) + '">Message</button>' +
            '</div>') +
      '</div>';
  }
  SCREENS._matchCard = matchCard;

  /* ---------------- Requests + waitlist ---------------- */
  SCREENS.requests = function () {
    var seg = S.reqSeg;
    var n = counts();
    var open = DB.timeline.filter(function (g) { return g.kind === 'slot' && !S.filled[g.id]; }).length;

    var body;
    if (seg === 'requests') {
      body = DB.requests.map(function (r, i) {
        var st = S.reqState[r.id];
        var cls = st === 'accepted' ? ' is-done' : st === 'sent' ? ' is-sent' : '';
        var facts = r.facts.map(function (f) {
          return '<span class="chip' + (f.m ? ' chip--' + f.m : '') + '">' + E(f.t) + '</span>';
        }).join('');
        var actions = st === 'accepted'
          ? '<div class="doneline">' + I('checkCircle', 'ic-sm') + 'Booked — intake and consent sent</div>'
          : st === 'sent'
            ? '<div class="doneline" style="color:var(--gold)">' + I('message', 'ic-sm') + 'Three times sent — waiting on their reply</div>'
            : '<div class="ractions">' +
                '<button class="btn btn--primary btn--sm" data-act="req-accept" data-id="' + r.id + '">' + E(r.primary) + '</button>' +
                '<button class="btn btn--soft btn--sm" data-act="req-propose" data-id="' + r.id + '">' + E(r.secondary) + '</button>' +
              '</div>';
        return '<div class="reqcard' + cls + ' stg" style="--i:' + i + '">' +
          '<div class="rh">' + AV(r.name) +
            '<span class="who"><h4>' + E(r.name) + '</h4><span class="kind">' + E(r.kind) + '</span></span>' +
            '<button class="icon-btn" data-act="push" data-screen="client" data-id="' + r.clientId + '">' + I('chevR', 'ic-sm') + '</button>' +
          '</div>' +
          '<div class="ask">' + r.ask + '</div>' +
          '<div class="facts">' + facts + '</div>' +
          '<div class="micro" style="margin-top:11px;line-height:1.5">' + E(r.fit) + '</div>' +
          actions + '</div>';
      }).join('');

      body = '<div class="fillbanner" style="background:var(--pine-soft);border-color:#D0DED4">' +
          '<div class="fh">' + I('inbox', 'ic-sm') + '<h4 style="color:#22412F">3 waiting on you</h4></div>' +
          '<p style="color:#3D6450">Requests come from your booking page with insurance, forms and policy already agreed — you just pick the slot.</p>' +
        '</div>' + body;
    } else {
      var offerable = DB.clients.filter(function (c) {
        return c.status === 'waitlist' && c.wait.match >= 65 && !S.filledBy[c.id];
      });
      var banner = open
        ? '<div class="fillbanner"><div class="fh">' + I('spark', 'ic-sm') +
            '<h4>' + open + ' opening today at 1:00 PM</h4></div>' +
            '<p>' + offerable.length + ' waitlisted clients match on coverage, modality and the window they asked for. Nobody is offered it until you say so.</p>' +
            '<button class="btn btn--clay btn--sm btn--block" data-act="fill-sheet" data-id="open-1">Match the opening</button></div>'
        : '<div class="fillbanner" style="background:var(--pine-soft);border-style:solid;border-color:#CFDDD3">' +
            '<div class="fh">' + I('checkCircle', 'ic-sm') + '<h4 style="color:#22412F">Opening filled at 12:41 PM</h4></div>' +
            '<p style="color:#3D6450">Elena Vasquez took today’s 1:00 PM. The other three stay on the list for the next gap.</p></div>';

      var order = ['elena', 'marcus', 'ruth', 'jordan'].map(function (id) { return DB.get(id); });
      body = banner + order.map(function (c, i) {
        return matchCard(c, { offerable: open > 0, stg: true, i: i });
      }).join('');
    }

    var segbar = '<div class="seg">' +
      '<button type="button" class="' + (seg === 'requests' ? 'on' : '') + '" data-act="seg" data-seg="requests">Requests <span class="n">' + DB.requests.length + '</span></button>' +
      '<button type="button" class="' + (seg === 'waitlist' ? 'on' : '') + '" data-act="seg" data-seg="waitlist">Waitlist <span class="n">' + n.waitlist + '</span></button>' +
      '</div>';

    return '<div class="scr-topbar"><div><h2>Requests</h2>' +
        '<div class="sub">' + (seg === 'requests' ? 'from your booking page' : 'waiting for a gap') + '</div></div>' +
        '<div class="nav-actions">' +
        '<button class="icon-btn" data-act="toast" data-msg="Auto-accept is on for returning clients with a standing slot">' + I('gauge', 'ic-sm') + '</button>' +
        '</div></div>' +
      '<div class="scr-body">' + segbar +
        '<div style="height:16px"></div>' + body +
      '</div>';
  };
})();
