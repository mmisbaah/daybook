/* ============================================================
   DAYBOOK — screen: the client-facing booking page
   The part a generalist scheduler can't express: visit types
   with clinical meaning, real insurance verification, standing
   cadence, intake measures and the cancellation policy.
   ============================================================ */

(function () {
  'use strict';
  var I = UI.icon, E = UI.esc;

  function price() {
    var v = DB.booking.visits.filter(function (x) { return x.id === S.bk.visit; })[0];
    var car = DB.booking.carriers.filter(function (x) { return x.id === S.bk.carrier; })[0];
    if (v.price === 0) return { big: 'Free', small: 'no card needed' };
    if (S.bk.carrier === 'self') return { big: '$' + v.price, small: 'self-pay' };
    if (!S.bk.verified) return { big: '$' + v.price, small: 'verify to see your copay' };
    if (car.ok === null) return { big: '$' + v.price, small: 'held until eligibility confirms' };
    var copay = car.id === 'aetna' ? 30 : 25;
    return { big: '$' + copay, small: 'copay · ' + car.name };
  }

  function verifyBlock() {
    var car = DB.booking.carriers.filter(function (x) { return x.id === S.bk.carrier; })[0];
    if (S.bk.carrier === 'self') {
      return '<div class="verify unset">' + I('card', 'ic-sm') + '<span>Self-pay — no verification needed. Superbill provided monthly if you want to claim it back.</span></div>';
    }
    if (S.bk.verifying) {
      return '<div class="verify pending"><span class="spin" style="border-color:rgba(158,117,25,.35);border-top-color:var(--gold)"></span>' +
        '<span>Checking eligibility with ' + E(car.name) + '…</span></div>';
    }
    if (!S.bk.verified) {
      return '<div class="verify unset">' + I('shield', 'ic-sm') +
        '<span>Member ID <b>' + E(S.bk.mid) + '</b> hasn’t been checked yet. We confirm before you pay anything.</span></div>';
    }
    return '<div class="verify">' + I('checkCircle', 'ic-sm') + '<span>' + car.msg + '</span></div>';
  }

  function slots() {
    return DB.booking.slots.map(function (d) {
      var btns = d.list.map(function (s) {
        var on = S.bk.slot === d.day + '|' + s.t;
        return '<button type="button" class="slotbtn' + (on ? ' on' : '') + (s.scarce ? ' scarce' : '') + '" ' +
          'data-act="bk-slot" data-v="' + E(d.day + '|' + s.t) + '">' +
          '<span class="lo"></span>' + E(s.t) + (s.scarce ? ' · 1 left' : '') + '</button>';
      }).join('');
      return '<div class="daygroup"><div class="dg-h"><span class="d">' + E(d.day) + '</span>' +
        '<span class="n">' + d.n + ' open</span></div><div class="slots">' + btns + '</div></div>';
    }).join('');
  }

  SCREENS.booking = function () {
    var b = DB.booking;
    var done = S.bk.done;
    var p = price();
    var v = b.visits.filter(function (x) { return x.id === S.bk.visit; })[0];

    /* ---- header + link bar ---- */
    var head = '<div class="scr-topbar"><div><h2>Booking page</h2>' +
        '<div class="sub">fairlight · public link</div></div>' +
        '<div class="nav-actions">' +
        '<button class="icon-btn" data-act="toast" data-msg="QR code ready for the waiting room poster">' + I('qr', 'ic-sm') + '</button>' +
        '<button class="icon-btn" data-act="toast" data-msg="Link copied to clipboard">' + I('copy', 'ic-sm') + '</button>' +
        '</div></div>';

    if (done) {
      var sel = S.bk.slot ? S.bk.slot.split('|') : ['—', '—'];
      return head +
        '<div class="scr-body">' +
          '<div class="previewbar"><div class="previewpill">Preview · what your client sees</div>' +
            urlBar() + '</div>' +
          '<div class="bpage"><div class="success">' +
            '<div class="ring">' + I('check', 'ic-lg') + '</div>' +
            '<h3>You’re booked</h3>' +
            '<div class="when"><b>' + E(sel[0]) + ' · ' + E(sel[1]) + '</b><br>' + E(v.name) + ' · ' + v.dur + ' min with Naomi Okafor</div>' +
            '<ul class="steps">' +
              b.before.map(function (s) {
                return '<li>' + I('checkCircle', 'ic-sm') + '<span><b>' + E(s.b) + '</b> — ' + E(s.s) + '</span></li>';
              }).join('') +
            '</ul>' +
            '<div class="stack-actions" style="padding:18px 0 4px">' +
              '<button class="btn btn--primary btn--block" data-act="toast" data-msg="Calendar file downloaded (.ics)">' + I('calendarDot') + 'Add to calendar</button>' +
              '<button class="btn btn--soft btn--block" data-act="bk-reset">Book another time</button>' +
            '</div>' +
            '<div class="flag flag--slate" style="margin:14px 0 0;text-align:left">' + I('heart', 'ic-sm') +
              '<span>Not for emergencies — call or text <b>988</b>, or go to your nearest ER. Fairlight replies within one business day.</span></div>' +
          '</div></div>' +
          '<div class="dayfoot"><div class="r">' + I('users', 'ic-sm') +
            '<span>Sent to you as the practice owner — your client sees the same page minus the preview bar.</span></div></div>' +
        '</div>';
    }

    /* ---- main form ---- */
    var visitCards = b.visits.map(function (x) {
      var on = S.bk.visit === x.id;
      return '<button type="button" class="vtype' + (on ? ' on' : '') + '" data-act="bk-visit" data-v="' + x.id + '">' +
        '<span class="radio"><i></i></span>' +
        '<span class="vt"><h4>' + E(x.name) + ' · ' + x.dur + ' min</h4><p>' + E(x.desc) + '</p></span>' +
        '<span class="pr"><span class="p">' + (x.price ? '$' + x.price : 'Free') + '</span>' +
        '<span class="c">' + E(x.pay) + '</span></span></button>';
    }).join('');

    var carriers = b.carriers.map(function (c) {
      return '<button type="button" class="carrier' + (S.bk.carrier === c.id ? ' on' : '') + '" data-act="bk-carrier" data-v="' + c.id + '">' +
        E(c.name) + '</button>';
    }).join('');

    var concerns = b.concerns.map(function (t) {
      var on = S.bk.concerns.indexOf(t) > -1;
      return '<button type="button" class="qchip' + (on ? ' on' : '') + '" data-act="bk-concern" data-v="' + E(t) + '">' + E(t) + '</button>';
    }).join('');

    var prior = ['yes', 'no'].map(function (t) {
      return '<button type="button" class="qchip' + (S.bk.prior === t ? ' on' : '') + '" data-act="bk-prior" data-v="' + t + '">' +
        (t === 'yes' ? 'Yes, before' : 'No, this is new') + '</button>';
    }).join('');

    var ready = S.bk.slot && S.bk.policy;

    var body = '<div class="scr-body">' +
      '<div class="previewbar"><div class="previewpill">Preview · what your client sees</div>' + urlBar() + '</div>' +

      '<div class="bpage">' +
        '<div class="bhero"><img src="assets/room.jpg" alt="The consultation room at Fairlight Counseling" onerror="this.style.display=\'none\'">' +
          '<div class="bh"><div class="k">' + E(DB.practice.city) + ' · telehealth across Oregon</div>' +
          '<h3>' + E(DB.practice.name) + '</h3>' +
          '<div class="m">' + E(DB.practice.clinician) + ' · ' + E(DB.practice.license) + '</div></div>' +
        '</div>' +

        '<div class="bbody">' +
          /* 1 — visit type */
          '<div class="bstep"><div class="bstep-h"><span class="num">1</span><span class="t">What kind of session</span>' +
            '<span class="hint">clinical, not generic</span></div>' + visitCards + '</div>' +

          /* 2 — insurance */
          '<div class="bstep"><div class="bstep-h"><span class="num">2</span><span class="t">How you’re paying</span>' +
            '<span class="hint">checked before you book</span></div>' +
            '<div class="carriers">' + carriers + '</div>' +
            '<div class="field">' +
              '<input class="inp" id="memberId" value="' + E(S.bk.mid) + '" aria-label="Member ID" spellcheck="false">' +
              '<button class="btn btn--soft btn--sm" data-act="bk-verify"' + (S.bk.verifying ? ' disabled' : '') + '>' +
              (S.bk.verifying ? '<span class="spin" style="border-color:rgba(38,71,58,.3);border-top-color:var(--pine)"></span>Checking'
                : S.bk.verified ? 'Re-check' : 'Verify') + '</button>' +
            '</div>' + verifyBlock() + '</div>' +

          /* 3 — time */
          '<div class="bstep"><div class="bstep-h"><span class="num">3</span><span class="t">Pick a time</span>' +
            '<span class="hint">' + E(DB.practice.tz) + '</span></div>' +
            '<div class="standing">' + I('repeat', 'ic-sm') +
              '<span class="st"><b>Already seeing Naomi?</b>' +
              '<span>Your standing weekly slot is held — you don’t need to rebook it here.</span></span></div>' +
            slots() +
            '<div class="limitnote">' + I('info', 'ic-sm') +
              '<span>Only the slots that fit this visit type are shown. Consults live in Thursday and Friday blocks; ongoing sessions get the full week.</span></div>' +
          '</div>' +

          /* 4 — a bit about you */
          '<div class="bstep"><div class="bstep-h"><span class="num">4</span><span class="t">A bit about you</span>' +
            '<span class="hint">goes to Naomi, not a CRM</span></div>' +
            '<div class="micro" style="margin-bottom:9px">What would you like help with?</div>' +
            '<div class="qchips">' + concerns + '</div>' +
            '<div class="micro" style="margin:15px 0 9px">Have you been in therapy before?</div>' +
            '<div class="radios">' + prior + '</div>' +
            '<div class="verify unset" style="margin-top:14px">' + I('file', 'ic-sm') +
              '<span>After booking you’ll get the <b>intake form and PHQ-9 by text</b> — about 6 minutes. Bring it to the session and we start with the work.</span></div>' +
          '</div>' +

          /* 5 — policy */
          '<div class="bstep"><div class="bstep-h"><span class="num">5</span><span class="t">Before you confirm</span></div>' +
            '<button type="button" class="policy' + (S.bk.policy ? ' on' : '') + '" data-act="bk-policy">' +
              '<span class="tick">' + I('check', 'ic-xs') + '</span>' +
              '<span><p><b>24-hour cancellation policy.</b> Cancelling or moving less than 24 hours ahead costs ' +
              (S.bk.carrier === 'self' ? '$75' : '$75, and your insurance won’t pay for a missed visit') + ' — no charge if you give a day’s notice.</p>' +
              '<p class="em">Fairlight isn’t an emergency service. In a crisis call or text <b>988</b>, or go to your nearest ER.</p></span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="dayfoot"><div class="r">' + I('lock', 'ic-sm') +
        '<span>Encrypted intake · nothing is shared with employers or insurers beyond the claim.</span></div>' +
        '<div class="r">' + I('clock', 'ic-sm') + '<span>Naomi replies to requests within <b>one business day</b>.</span></div>' +
      '</div>' +
    '</div>' +

    '<div class="bfoot">' +
      '<div class="tot"><div class="k">' + E(v.name) + ' · ' + v.dur + ' min</div>' +
      '<div class="v">' + E(p.big) + ' <small>' + E(p.small) + '</small></div></div>' +
      '<button class="btn ' + (ready ? 'btn--primary' : 'btn--quiet') + '" data-act="bk-submit"' + (ready ? '' : ' disabled') + '>' +
      (S.bk.slot && !S.bk.policy ? 'Accept policy' : 'Request this time') + '</button>' +
    '</div>';

    return head + body;
  };

  function urlBar() {
    return '<div class="urlbar"><span class="u">' + I('lock', 'ic-sm') + '<span>' + E(DB.practice.url) + '</span></span>' +
      '<button class="icon-btn" data-act="toast" data-msg="Link copied — paste it anywhere">' + I('copy', 'ic-sm') + '</button></div>';
  }
})();
