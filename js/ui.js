/* ============================================================
   DAYBOOK — ui helpers: icons, formatting, tiny DOM utilities
   ============================================================ */

var UI = (function () {
  'use strict';

  /* ---- inline SVG icon set (1.6 stroke, 24 grid) ---- */
  var ICONS = {
    calendar:'<rect x="3" y="4.8" width="18" height="16.2" rx="3"/><path d="M3 9.6h18M8 2.6v4.2M16 2.6v4.2"/>',
    calendarDot:'<rect x="3" y="4.8" width="18" height="16.2" rx="3"/><path d="M3 9.6h18M8 2.6v4.2M16 2.6v4.2"/><circle cx="12" cy="15" r="1.7" fill="currentColor" stroke="none"/>',
    users:'<path d="M15.5 20v-1.8a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4V20"/><circle cx="9.5" cy="7.5" r="3.4"/><path d="M21 20v-1.8a4 4 0 0 0-3-3.87M16.2 4.3a4 4 0 0 1 0 7.75"/>',
    inbox:'<path d="M3.5 12.5h4l1.6 2.6h5.8l1.6-2.6h4"/><path d="M5.7 5.4h12.6a2 2 0 0 1 1.86 1.28l1.74 4.4v5.4a2 2 0 0 1-2 2H4.1a2 2 0 0 1-2-2v-5.4l1.74-4.4A2 2 0 0 1 5.7 5.4Z"/>',
    link:'<path d="M10.2 13.4a3.6 3.6 0 0 0 5.3.4l2.6-2.6a3.6 3.6 0 1 0-5.1-5.1l-1.5 1.5"/><path d="M13.8 10.6a3.6 3.6 0 0 0-5.3-.4l-2.6 2.6a3.6 3.6 0 1 0 5.1 5.1l1.5-1.5"/>',
    chevL:'<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    chevR:'<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
    chevD:'<path d="M5.5 9.5 12 16l6.5-6.5"/>',
    search:'<circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.4 15.4 4.1 4.1"/>',
    plus:'<path d="M12 5.2v13.6M5.2 12h13.6"/>',
    check:'<path d="m4.8 12.4 4.7 4.7L19.2 7.4"/>',
    checkCircle:'<circle cx="12" cy="12" r="8.6"/><path d="m8.3 12.2 2.6 2.6 4.8-5.2"/>',
    clock:'<circle cx="12" cy="12" r="8.6"/><path d="M12 7.2V12l3.1 1.9"/>',
    video:'<rect x="2.6" y="6" width="13.4" height="12" rx="3"/><path d="m16 10.6 4.2-2.6a.7.7 0 0 1 1.1.6v6.8a.7.7 0 0 1-1.1.6L16 13.4"/>',
    pin:'<path d="M19 10.3c0 5.1-7 11.1-7 11.1s-7-6-7-11.1a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10.2" r="2.6"/>',
    shield:'<path d="M12 3 5 5.7v5.5c0 4.3 3 8.1 7 9.3 4-1.2 7-5 7-9.3V5.7Z"/><path d="m9 12 2.2 2.2L15.4 10"/>',
    alert:'<path d="M10.4 4.6 2.9 17.5A1.7 1.7 0 0 0 4.4 20h15.2a1.7 1.7 0 0 0 1.5-2.5L13.6 4.6a1.85 1.85 0 0 0-3.2 0Z"/><path d="M12 9.4v4M12 16.6h.01"/>',
    spark:'<path d="M12 3.2 13.7 8l4.8 1.7-4.8 1.7L12 16.2 10.3 11.4 5.5 9.7 10.3 8Z"/><path d="M18.4 15.4 19.2 17.6l2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/>',
    copy:'<rect x="8.6" y="8.6" width="11.4" height="11.4" rx="2.6"/><path d="M15.6 5.6V5a2 2 0 0 0-2-2H5.4a2 2 0 0 0-2 2v8.2a2 2 0 0 0 2 2h.6"/>',
    x:'<path d="M6.4 6.4 17.6 17.6M17.6 6.4 6.4 17.6"/>',
    arrowR:'<path d="M4.8 12h14.4M13.4 6.2 19.2 12l-5.8 5.8"/>',
    bell:'<path d="M18 9.4a6 6 0 1 0-12 0c0 5.1-2 6.5-2 6.5h16s-2-1.4-2-6.5Z"/><path d="M13.7 19.4a2 2 0 0 1-3.4 0"/>',
    phone:'<path d="M20.4 16.7v2.6a1.7 1.7 0 0 1-1.9 1.7 17 17 0 0 1-7.4-2.6 16.7 16.7 0 0 1-5.1-5.1 17 17 0 0 1-2.6-7.5A1.7 1.7 0 0 1 5.1 4h2.6a1.7 1.7 0 0 1 1.7 1.5c.1.9.3 1.7.6 2.5a1.7 1.7 0 0 1-.4 1.8l-1.1 1.1a13.6 13.6 0 0 0 5.1 5.1l1.1-1.1a1.7 1.7 0 0 1 1.8-.4c.8.3 1.6.5 2.5.6a1.7 1.7 0 0 1 1.4 1.7Z"/>',
    message:'<path d="M20.4 11.6a7.7 7.7 0 0 1-8.3 7.7 8.6 8.6 0 0 1-3.3-.7L4 20.4l1.9-4.5a7.7 7.7 0 0 1-.8-3.5 7.7 7.7 0 0 1 7.7-7.7 7.7 7.7 0 0 1 7.6 6.9Z"/>',
    file:'<path d="M14 3.2H7.4a2 2 0 0 0-2 2v13.6a2 2 0 0 0 2 2h9.2a2 2 0 0 0 2-2V8Z"/><path d="M14 3.2V8h4.6M8.8 13h6.4M8.8 16.4h4.4"/>',
    heart:'<path d="M19.4 5.9a4.7 4.7 0 0 0-6.7 0L12 6.6l-.7-.7a4.7 4.7 0 1 0-6.7 6.7L12 20l7.4-7.4a4.7 4.7 0 0 0 0-6.7Z"/>',
    card:'<rect x="2.6" y="5.4" width="18.8" height="13.2" rx="3"/><path d="M2.6 10h18.8M6.4 14.6h3"/>',
    lock:'<rect x="4.6" y="10.4" width="14.8" height="10.2" rx="3"/><path d="M8.2 10.4V7.6a3.8 3.8 0 0 1 7.6 0v2.8"/>',
    download:'<path d="M12 3.6v11M7.6 10.4 12 14.8l4.4-4.4M4.4 19.6h15.2"/>',
    repeat:'<path d="M3.6 8.4h13.2a3.6 3.6 0 0 1 3.6 3.6M20.4 15.6H7.2a3.6 3.6 0 0 1-3.6-3.6"/><path d="m6.4 5.4-2.8 3 2.8 3M17.6 12.6l2.8 3-2.8 3"/>',
    hourglass:'<path d="M6.6 3.4h10.8M6.6 20.6h10.8"/><path d="M17.4 3.4v3.1c0 2.4-5.4 5-5.4 5.5 0 .5 5.4 3.1 5.4 5.5v3.1M6.6 3.4v3.1c0 2.4 5.4 5 5.4 5.5 0 .5-5.4 3.1-5.4 5.5v3.1"/>',
    user:'<circle cx="12" cy="8" r="3.8"/><path d="M4.6 20.4a7.4 7.4 0 0 1 14.8 0"/>',
    note:'<rect x="4.2" y="3.6" width="15.6" height="16.8" rx="3"/><path d="M8.4 8.6h7.2M8.4 12.4h7.2M8.4 16.2h4.4"/>',
    gauge:'<path d="M4.4 17.4a8.6 8.6 0 1 1 15.2 0"/><path d="m14.8 9.6-3.4 4.6"/><circle cx="12" cy="15.4" r="1.5" fill="currentColor" stroke="none"/>',
    wifi:'<path d="M2.6 8.6a14 14 0 0 1 18.8 0M6 12.4a9.2 9.2 0 0 1 12 0M9.4 16.2a4.4 4.4 0 0 1 5.2 0"/><circle cx="12" cy="19.6" r="1.2" fill="currentColor" stroke="none"/>',
    qr:'<rect x="3.6" y="3.6" width="6.4" height="6.4" rx="1.6"/><rect x="14" y="3.6" width="6.4" height="6.4" rx="1.6"/><rect x="3.6" y="14" width="6.4" height="6.4" rx="1.6"/><path d="M14 14h2.6v2.6H14zM18 18h2.4v2.4H18M14 20.4h1.6M20.4 14v1.6"/>',
    moon:'<path d="M20 14.2A8.4 8.4 0 0 1 9.8 4 8.6 8.6 0 1 0 20 14.2Z"/>',
    scissors:'<circle cx="6.4" cy="6.4" r="2.6"/><circle cx="6.4" cy="17.6" r="2.6"/><path d="M8.6 8.2 20 18.4M20 5.6 8.6 15.8"/>',
    smile:'<circle cx="12" cy="12" r="8.6"/><path d="M8.6 14.2a4.4 4.4 0 0 0 6.8 0M9.2 9.6h.01M14.8 9.6h.01"/>',
    info:'<circle cx="12" cy="12" r="8.6"/><path d="M12 11.2v5M12 7.9h.01"/>',
    stamp:'<path d="M6 20.4h12M8.4 16.4h7.2v2.4H8.4z"/><path d="M10.8 16.4V13a2.6 2.6 0 1 0-3.6-2.4c0 1.4 1.4 2 1.4 3.4v2.4M13.2 16.4V13a2.6 2.6 0 1 1 3.6-2.4c0 1.4-1.4 2-1.4 3.4v2.4"/>'
  };

  function icon(name, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[name] || '') + '</svg>';
  }

  /* ---- tiny DOM helpers ---- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* avatar tint — deterministic, muted paper tones */
  var TONES = ['#E6DFCC','#DFE4DA','#E9DDD4','#DCE1E7','#E8E1D0','#DDE4DD','#EAE0E4','#DEE3E3'];
  function tone(seed) {
    var n = 0, s = String(seed);
    for (var i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 9973;
    return TONES[n % TONES.length];
  }
  function initials(name) {
    var p = String(name).replace(/[^A-Za-z ]/g, '').trim().split(/\s+/);
    return ((p[0] || '')[0] || '' + ((p[1] || '')[0] || '')).toUpperCase() +
      ((p[1] || '')[0] || '').toUpperCase();
  }
  function ava(name, cls) {
    return '<span class="ava ' + (cls || '') + '" style="--tone:' + tone(name) + '">' + esc(initials(name)) + '</span>';
  }

  /* ---- misc ---- */
  function chip(text, mod, ic) {
    return '<span class="chip ' + (mod ? 'chip--' + mod : '') + '">' +
      (ic ? icon(ic, 'ic-xs') : '') + esc(text) + '</span>';
  }
  function byId(id) { return document.getElementById(id); }

  return {
    icon: icon, esc: esc, ava: ava, tone: tone, initials: initials,
    chip: chip, byId: byId, ICONS: ICONS
  };
})();
