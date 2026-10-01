/* Shared, locally saved workspace controls for the phone and desktop views. */
(function () {
  'use strict';
  var E = UI.esc;
  var sampleDate = '2026-09-30';
  var selected = localStorage.getItem('daybook-selected-date') || localISO(new Date());
  var mobile = !document.querySelector('.app');
  var exampleIds = DB.clients.filter(function (c) { return !/^client-/.test(c.id); }).map(function (c) { return c.id; });
  function localISO(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function dateLabel(value) {
    return new Date(value + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
  function moveDate(days) {
    setDate(new Date(Date.parse(selected + 'T00:00:00Z') + days * 86400000).toISOString().slice(0, 10));
  }
  function setDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    selected = value;
    localStorage.setItem('daybook-selected-date', selected);
    refresh();
  }
  function refresh() {
    if (window.DaybookRefresh) window.DaybookRefresh();
    else if (typeof render === 'function') render();
  }
  function appointments() {
    var rows = DB.timeline.filter(function (row) {
      return (row.date || sampleDate) === selected && row.kind === 'session' && !!DB.get(row.id);
    });
    return rows.sort(function (a, b) { return timeValue(a) - timeValue(b); });
  }
  function timeValue(row) {
    var parts = String(row.t || '9:00').split(':');
    return (+parts[0] % 12) * 60 + (+parts[1] || 0) + (row.mer === 'PM' ? 720 : 0);
  }
  function button(action, label, extra) {
    return '<button type="button" data-db="' + action + '"' + (extra || '').replace(/ class="[^"]*"/, '') + ' class="db-btn' + ((extra || '').indexOf('db-primary') >= 0 ? ' db-primary' : '') + '">' + label + '</button>';
  }
  function schedule() {
    var rows = appointments();
    var html = '<div class="db-workspace"><div class="db-heading"><div class="db-heading-copy"><div class="db-eyebrow"><span class="db-live-dot"></span> DAYBOOK / SCHEDULE</div><h1>' + E(dateLabel(selected)) + '</h1><p>Your practice calendar · saved on this device</p></div><div class="db-day-count"><strong>' + rows.length + '</strong><span>appointment' + (rows.length === 1 ? '' : 's') + '</span></div></div>' +
      '<div class="db-controls"><div class="db-date-nav">' + button('prev', '←', ' aria-label="Previous day"') + '<label class="db-date-label"><span>SELECT DATE</span><input id="db-date" type="date" value="' + selected + '"></label>' + button('next', '→', ' aria-label="Next day"') + '</div><div class="db-quick-nav">' + button('today', 'Today') + button('sample', 'Example day') + '</div></div>' +
      '<div class="db-actions"><div><span class="db-section-kicker">APPOINTMENTS</span><h2>Daily schedule</h2></div><div class="db-action-buttons">' + button('new-session', '+ Appointment', ' class="db-primary"') + button('new-client', '+ Client') + '</div></div>';
    if (!rows.length) html += '<div class="db-empty"><h2>No appointments on this date</h2><p>Add an appointment or choose another date. The example schedule is on September 30, 2026.</p></div>';
    else html += '<div class="db-list">' + rows.map(function (row) {
      var c = DB.get(row.id);
      var initials = c.name.split(/\s+/).slice(0, 2).map(function (p) { return p[0] || ''; }).join('').toUpperCase();
      return '<div class="db-card"><div class="db-time"><b>' + E(row.t) + '</b><small>' + E(row.mer) + '</small></div><div class="db-avatar">' + E(initials) + '</div><div class="db-card-main"><strong>' + E(c.name) + '</strong><span>' + E(c.modality) + (row.type ? ' · ' + E(row.type) : '') + '</span></div><div class="db-card-actions">' +
        button('edit-session', 'Edit', ' data-key="' + E(row.key || row.id) + '"') + button('delete-session', 'Delete', ' data-key="' + E(row.key || row.id) + '"') + '</div></div>';
    }).join('') + '</div>';
    html += '<div class="db-footer-note"><span>Local workspace</span>' + button('clear-examples', 'Remove example data') + '</div>';
    return (mobile ? '<div class="scr-body">' : '') + html + '</div>' + (mobile ? '</div>' : '');
  }
  SCREENS.today = schedule;
  var originalClients = SCREENS.clients;
  SCREENS.clients = function () {
    return '<div class="db-client-actions">' + button('new-client', '+ Add client', ' class="db-primary"') + button('clear-examples', 'Remove example data') + '</div>' + originalClients.apply(this, arguments);
  };
  var originalClient = SCREENS.client;
  SCREENS.client = function (entry) {
    var c = DB.get(entry.params.id);
    return '<div class="db-client-actions">' + button('edit-client', 'Edit client', ' data-id="' + E(c.id) + '"') + button('delete-client', 'Delete client', ' data-id="' + E(c.id) + '"') + '</div>' + originalClient.apply(this, arguments);
  };
  var originalBooking = SCREENS.booking;
  SCREENS.booking = function () {
    return '<div class="db-client-actions"><span class="db-booking-note">Book a new client locally and add the appointment to the daybook.</span>' + button('new-booking', 'Book a new client', ' class="db-primary"') + '</div>' + originalBooking.apply(this, arguments);
  };

  function modal(title, fields, submit, values) {
    var old = document.getElementById('db-modal');
    if (old) old.remove();
    var wrap = document.createElement('div');
    wrap.id = 'db-modal';
    wrap.className = 'db-modal-backdrop';
    wrap.innerHTML = '<form class="db-modal" id="db-form"><h2>' + E(title) + '</h2>' + fields + '<div class="db-modal-actions">' + button('close', 'Cancel') + '<button class="db-btn db-primary" type="submit">Save</button></div></form>';
    document.body.appendChild(wrap);
    Object.keys(values || {}).forEach(function (key) { var el = wrap.querySelector('[name="' + key + '"]'); if (el) el.value = values[key] || ''; });
    wrap.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); submit(new FormData(e.target)); wrap.remove(); refresh(); });
    wrap.addEventListener('click', function (e) { if (e.target === wrap) wrap.remove(); });
    wrap.querySelector('input,select').focus();
  }
  function field(label, name, type, required) {
    return '<label class="db-field">' + label + '<input name="' + name + '" type="' + (type || 'text') + '"' + (required ? ' required' : '') + '></label>';
  }
  function select(label, name, options) {
    return '<label class="db-field">' + label + '<select name="' + name + '">' + options.map(function (x) { return '<option value="' + x + '">' + x + '</option>'; }).join('') + '</select></label>';
  }
  function clientFields() {
    return field('Full name', 'name', 'text', true) + field('Pronouns', 'pronouns') + select('Status', 'status', ['active', 'intake', 'waitlist', 'paused']) +
      select('Modality', 'modality', ['Telehealth', 'In-person', 'Either']) + field('Contact', 'contact') + field('Prep note', 'prep');
  }
  function newClient(id) {
    var current = id && DB.get(id);
    modal(current ? 'Edit client' : 'Add client', clientFields(), function (data) {
      var c = current || { id: 'client-' + Date.now(), since: dateLabel(localISO(new Date())), cadence: 'As needed', slot: '', slotLong: '', next: 'Not scheduled', last: '—', insurance: { carrier: 'Self-pay', state: 'self', copay: '$0', member: '—' }, balance: '$0', focus: [], flags: [], docs: { intake: 'due', consent: 'due', phq9: 'due' }, scores: { phq: '—', gad: '—', trend: '—' }, history: [], wait: null };
      ['name', 'pronouns', 'status', 'modality', 'contact', 'prep'].forEach(function (key) { c[key] = String(data.get(key) || '').trim(); });
      if (c.status === 'waitlist' && !c.wait) c.wait = { match: 80, score: 80, criteria: [], waited: 'Just added' };
      if (c.status !== 'waitlist') c.wait = null;
      if (!current) DB.clients.push(c);
      DB.save();
    }, current || {});
  }
  function sessionFields() {
    var options = DB.clients.map(function (c) { return '<option value="' + E(c.id) + '">' + E(c.name) + '</option>'; }).join('');
    return '<label class="db-field">Client<select name="id" required>' + options + '</select></label>' + field('Date', 'date', 'date', true) + field('Time', 'time', 'time', true) + field('Session type', 'type');
  }
  function newSession(key) {
    if (!DB.clients.length) { newClient(); return; }
    var current = key && DB.timeline.find(function (r) { return (r.key || r.id) === key && r.kind === 'session'; });
    var time = current && current.t ? String((+current.t.split(':')[0] % 12) + (current.mer === 'PM' ? 12 : 0)).padStart(2, '0') + ':' + current.t.split(':')[1] : '09:00';
    modal(current ? 'Edit appointment' : 'Add appointment', sessionFields(), function (data) {
      var raw = String(data.get('time'));
      var hour = +raw.split(':')[0];
      var row = current || { kind: 'session', key: 'session-' + Date.now(), state: 'next' };
      row.id = String(data.get('id'));
      row.date = String(data.get('date'));
      row.t = String(hour % 12 || 12) + ':' + raw.split(':')[1];
      row.mer = hour >= 12 ? 'PM' : 'AM';
      row.type = String(data.get('type') || 'Session').trim();
      if (!current) DB.timeline.push(row);
      selected = row.date;
      localStorage.setItem('daybook-selected-date', selected);
      DB.save();
    }, { id: current && current.id, date: current ? (current.date || sampleDate) : selected, time: time, type: current && current.type });
  }
  function newBooking() {
    modal('Book a new client', field('Full name', 'name', 'text', true) + field('Contact', 'contact', 'text', true) +
      field('Date', 'date', 'date', true) + field('Time', 'time', 'time', true) + select('Modality', 'modality', ['Telehealth', 'In-person']), function (data) {
      var name = String(data.get('name')).trim();
      var date = String(data.get('date'));
      var time = String(data.get('time'));
      var hour = +time.split(':')[0];
      var client = { id: 'client-' + Date.now(), name: name, pronouns: '', status: 'intake', cadence: 'As needed', since: dateLabel(localISO(new Date())), slot: '', slotLong: '', next: dateLabel(date) + ' ' + time, last: '—', modality: String(data.get('modality')), insurance: { carrier: 'Self-pay', state: 'self', copay: '$0', member: '—' }, balance: '$0', focus: [], flags: [], prep: '', docs: { intake: 'due', consent: 'due', phq9: 'due' }, scores: { phq: '—', gad: '—', trend: '—' }, contact: String(data.get('contact')).trim(), history: [], wait: null };
      DB.clients.push(client);
      DB.timeline.push({ kind: 'session', key: 'session-' + Date.now(), id: client.id, date: date, t: String(hour % 12 || 12) + ':' + time.split(':')[1], mer: hour >= 12 ? 'PM' : 'AM', type: 'Initial session', state: 'next' });
      DB.save();
      selected = date;
      localStorage.setItem('daybook-selected-date', selected);
      if (mobile) { S.tab = 'today'; S.stacks.today = [{ id: 'today', params: {} }]; }
      else S.nav = 'today';
    }, { date: selected, time: '09:00' });
  }
  function removeClient(id) {
    var c = DB.get(id);
    if (!c || !confirm('Delete ' + c.name + ' and their appointments?')) return;
    DB.clients.splice(DB.clients.indexOf(c), 1);
    DB.timeline = DB.timeline.filter(function (r) { return r.id !== id; });
    DB.requests = DB.requests.filter(function (r) { return r.clientId !== id; });
    DB.save();
    if (mobile) { S.stacks.clients = [{ id: 'clients', params: {} }]; S.tab = 'clients'; }
    else { S.nav = 'clients'; }
    refresh();
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-db]');
    if (!el) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var a = el.dataset.db;
    if (a === 'prev') moveDate(-1);
    if (a === 'next') moveDate(1);
    if (a === 'today') setDate(localISO(new Date()));
    if (a === 'sample') setDate(sampleDate);
    if (a === 'new-client') newClient();
    if (a === 'edit-client') newClient(el.dataset.id);
    if (a === 'delete-client') removeClient(el.dataset.id);
    if (a === 'new-session') newSession();
    if (a === 'new-booking') newBooking();
    if (a === 'edit-session') newSession(el.dataset.key);
    if (a === 'delete-session') {
      var row = DB.timeline.find(function (r) { return (r.key || r.id) === el.dataset.key && r.kind === 'session'; });
      if (row && confirm('Delete this appointment?')) { DB.timeline.splice(DB.timeline.indexOf(row), 1); DB.save(); refresh(); }
    }
    if (a === 'clear-examples' && confirm('Remove all preloaded example clients, appointments, and requests? Your own entries will stay.')) {
      DB.clients = DB.clients.filter(function (c) { return exampleIds.indexOf(c.id) < 0; });
      DB.timeline = DB.timeline.filter(function (r) { return r.kind === 'session' && exampleIds.indexOf(r.id) < 0 && r.key; });
      DB.requests = [];
      DB.save(); refresh();
    }
    if (a === 'close') document.getElementById('db-modal').remove();
  }, true);
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act="bk-submit"]');
    if (!el || el.disabled) return;
    e.preventDefault(); e.stopImmediatePropagation(); newBooking();
  }, true);
  document.addEventListener('change', function (e) { if (e.target.id === 'db-date') setDate(e.target.value); });
})();
