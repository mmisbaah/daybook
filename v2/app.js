const view = document.getElementById('view');
const editor = document.getElementById('editor');
const editorForm = document.getElementById('editorForm');
const notice = document.getElementById('notice');
const localToday = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`; };
const state = { page: 'calendar', mode: 'week', date: localToday(), data: null };
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const day = value => new Date(`${value}T12:00:00Z`);
const iso = date => date.toISOString().slice(0, 10);
const addDays = (value, count) => { const date = day(value); date.setUTCDate(date.getUTCDate() + count); return iso(date); };
const fmt = (value, options = { month: 'long', day: 'numeric', year: 'numeric' }) => new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', ...options }).format(day(value));
const label = value => value.slice(0, 5);
function message(text) { notice.textContent = text; notice.classList.add('show'); setTimeout(() => notice.classList.remove('show'), 4200); }
async function api(path, options = {}) {
  const response = await fetch(`/api/admin/${path}`, { credentials: 'same-origin', headers: { 'content-type': 'application/json' }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: response.status });
  return data;
}
async function authApi(path, options = {}) {
  const response = await fetch(`/api/auth/${path}`, { credentials: 'same-origin', headers: { 'content-type': 'application/json' }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}
async function refresh() {
  try { state.data = await api('bootstrap'); render(); }
  catch (error) { if (error.status === 401) await renderSignIn(); else renderError(error.message); }
}
async function renderSignIn() {
  try {
    const status = await authApi('status');
    const setup = status.setupRequired;
    view.innerHTML = `<div class="auth-card card"><span class="eyebrow">PRIVATE WORKSPACE</span><h1>${setup ? 'Set up Daybook' : 'Welcome back'}</h1><p>${setup ? 'Create your private practice account using the one-time setup code.' : 'Sign in to open your schedule and client list.'}</p><form id="authForm"><label class="field">Admin email<input type="email" name="email" value="${esc(status.adminEmail || '')}" ${setup ? 'readonly' : 'required'} autocomplete="username"></label>${setup ? '<label class="field">One-time setup code<input name="setupToken" required autocomplete="off"></label>' : ''}<label class="field">Password<input type="password" name="password" required ${setup ? 'minlength="14" autocomplete="new-password"' : 'autocomplete="current-password"'}></label><button class="primary" type="submit">${setup ? 'Create account' : 'Sign in'}</button></form></div>`;
    view.querySelector('#authForm').addEventListener('submit', async event => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('button'); button.disabled = true;
      try { await authApi(setup ? 'setup' : 'login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); await refresh(); }
      catch (error) { message(error.message); button.disabled = false; }
    });
  } catch (error) { renderError(error.message); }
}
function renderError(text) { view.innerHTML = `<div class="empty"><h2>Workspace unavailable</h2><p>${esc(text)}</p><button class="primary" data-action="reload">Try again</button></div>`; }
function render() {
  if (!state.data) return;
  if (!state.data.practice.name) state.page = 'settings';
  document.getElementById('practiceName').textContent = state.data.practice.name || 'Set up your practice';
  const pending = state.data.requests.filter(row => row.status === 'pending').length;
  const badge = document.getElementById('requestCount'); badge.hidden = !pending; badge.textContent = pending;
  document.querySelectorAll('[data-view]').forEach(button => { button.classList.toggle('active', button.dataset.view === state.page); button.setAttribute('aria-current', button.dataset.view === state.page ? 'page' : 'false'); });
  view.innerHTML = ({ calendar, clients, requests, settings })[state.page]();
  document.title = `${state.page[0].toUpperCase()}${state.page.slice(1)} · Daybook`;
}
function head(title, sub, actions = '') { return `<header class="page-head"><div><span class="eyebrow">DAYBOOK / ${esc(state.page.toUpperCase())}</span><h1>${esc(title)}</h1><p>${esc(sub)}</p></div><div class="row-actions">${actions}</div></header>`; }
function appointmentsOn(date) { return state.data.appointments.filter(row => row.date === date && row.status !== 'cancelled').sort((a,b) => a.time.localeCompare(b.time)); }
function clientName(id) { return state.data.clients.find(row => row.id === id)?.name || 'Unknown client'; }
function datesInView() {
  const date = day(state.date);
  if (state.mode === 'week') {
    const offset = (date.getUTCDay() + 6) % 7;
    return Array.from({ length: 7 }, (_, i) => addDays(state.date, i - offset));
  }
  const first = `${state.date.slice(0, 7)}-01`;
  const offset = (day(first).getUTCDay() + 6) % 7;
  const days = new Date(Number(state.date.slice(0,4)), Number(state.date.slice(5,7)), 0).getDate();
  return Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) => addDays(first, i - offset));
}
function calendar() {
  const dates = datesInView();
  const title = state.mode === 'week' ? `${fmt(dates[0], { month: 'short', day: 'numeric' })} – ${fmt(dates[6], { month: 'short', day: 'numeric', year: 'numeric' })}` : fmt(state.date, { month: 'long', year: 'numeric' });
  const controls = `<button class="secondary" data-action="new-appointment">+ Appointment</button><button class="primary" data-action="new-client">+ Client</button>`;
  return head('Your calendar', 'Appointments saved to your practice workspace.', controls) +
    `<div class="toolbar"><button class="ghost small" data-action="prev" aria-label="Previous ${state.mode}">←</button><strong>${esc(title)}</strong><button class="ghost small" data-action="next" aria-label="Next ${state.mode}">→</button><input type="date" id="jumpDate" aria-label="Jump to date" value="${state.date}"><button class="ghost small" data-action="today">Today</button><span class="spacer"></span><button class="${state.mode === 'week' ? 'primary' : 'ghost'} small" data-action="mode" data-mode="week">Week</button><button class="${state.mode === 'month' ? 'primary' : 'ghost'} small" data-action="mode" data-mode="month">Month</button></div>` +
    `<div class="grid ${state.mode === 'week' ? 'week-grid' : 'week-grid month-grid'}">${dates.map(date => `<section class="day-card ${date === localToday() ? 'today' : ''}"><h3>${fmt(date, { weekday: 'short' })}<strong>${fmt(date, { day: 'numeric' })}</strong></h3>${appointmentsOn(date).map(row => `<button class="appointment ${esc(row.status)}" data-action="edit-appointment" data-id="${esc(row.id)}"><b>${esc(label(row.time))}</b> ${esc(clientName(row.client_id))}<small>${esc(row.service)} · ${esc(row.status.replace('_',' '))}</small></button>`).join('') || '<span class="hint">No appointments</span>'}</section>`).join('')}</div>`;
}
function clients() {
  const rows = state.data.clients;
  return head('Clients', `${rows.length} in your practice`, '<button class="primary" data-action="new-client">+ Add client</button>') +
    (rows.length ? `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(row => `<tr><td><strong>${esc(row.name)}</strong></td><td>${esc(row.email || '—')}</td><td><span class="pill">${esc(row.status)}</span></td><td><div class="row-actions"><button data-action="edit-client" data-id="${esc(row.id)}">Edit</button><button class="danger" data-action="delete-client" data-id="${esc(row.id)}">Delete</button></div></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty"><h2>No clients yet</h2><p>Add your first client or accept a booking request.</p><button class="primary" data-action="new-client">Add client</button></div>`);
}
function requests() {
  const rows = state.data.requests;
  return head('Booking requests', 'New requests are saved here. Accepting one creates a client and appointment.') +
    (rows.length ? `<div class="table-wrap"><table><thead><tr><th>Client</th><th>Requested time</th><th>Service</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(row => `<tr><td><strong>${esc(row.name)}</strong><br><span class="hint">${esc(row.email)}</span></td><td>${esc(fmt(row.date))} · ${esc(row.time)}</td><td>${esc(row.service)}</td><td><span class="pill ${esc(row.status)}">${esc(row.status)}</span></td><td><div class="row-actions">${row.status === 'pending' ? `<button data-action="request-accept" data-id="${esc(row.id)}">Accept</button><button class="danger" data-action="request-decline" data-id="${esc(row.id)}">Decline</button>` : '—'}</div></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty"><h2>No requests yet</h2><p>When you enable online booking, requests will appear here.</p><a class="button" href="/book/" target="_blank" rel="noopener">View booking page</a></div>`);
}
function settings() {
  const p = state.data.practice;
  const services = p.services.map(row => `${row.name}, ${row.duration}`).join('\n');
  const days = [['1','Monday'],['2','Tuesday'],['3','Wednesday'],['4','Thursday'],['5','Friday'],['6','Saturday'],['0','Sunday']];
  return head('Practice settings', p.name ? 'Update your public booking profile and weekly hours.' : 'Set up your practice before taking bookings.') +
    `<form id="settingsForm"><section class="card"><h2>Practice profile</h2><div class="form-grid"><label class="field">Practice name<input name="name" value="${esc(p.name)}" required maxlength="80"></label><label class="field">Practitioner name<input name="practitioner" value="${esc(p.practitioner)}" required maxlength="80"></label><label class="field">Contact email<input name="email" type="email" value="${esc(p.email)}" required></label><label class="field">Location or online<input name="location" value="${esc(p.location)}"></label><label class="field">Time zone<select name="timezone">${['UTC','America/Los_Angeles','America/New_York','Europe/London','Asia/Tashkent'].map(tz => `<option value="${tz}" ${p.timezone === tz ? 'selected' : ''}>${tz}</option>`).join('')}</select></label></div></section>` +
    `<section class="card"><h2>Services and hours</h2><p class="hint">One service per line, followed by its length in minutes. Example: Initial consultation, 50</p><label class="field">Services<textarea name="services" required>${esc(services)}</textarea></label><div class="form-grid" style="margin-top:20px">${days.map(([key,name]) => `<label class="field">${name}<input name="day-${key}" value="${esc((p.availability[key] || []).join(', '))}" placeholder="09:00, 10:00, 14:00"></label>`).join('')}</div></section>` +
    `<section class="card"><h2>Online booking</h2><label><input type="checkbox" name="bookingEnabled" ${p.bookingEnabled ? 'checked' : ''}> Accept booking requests from your public page</label><p class="hint" style="margin-top:10px">Requests are saved for your review. A request is not a confirmed appointment. Email delivery will be enabled after a sending address is connected.</p><div class="form-actions"><button type="submit" class="primary">Save settings</button><button type="button" class="ghost" data-action="export">Export practice data</button><label class="button ghost">Import backup<input type="file" id="importFile" accept="application/json,.json" hidden></label><a href="/book/" target="_blank" rel="noopener">Open public booking page ↗</a></div></section></form>`;
}
function openEditor(title, fields, onSubmit) {
  editorForm.innerHTML = `<h2>${esc(title)}</h2><div class="form-grid">${fields}</div><div class="form-actions"><button class="primary" type="submit">Save</button><button class="ghost" type="button" id="closeEditor">Cancel</button></div>`;
  editorForm.onsubmit = async event => { event.preventDefault(); const button = editorForm.querySelector('[type=submit]'); button.disabled = true; try { await onSubmit(new FormData(editorForm)); editor.close(); await refresh(); message('Saved'); } catch (error) { message(error.message); button.disabled = false; } };
  editor.showModal();
  editorForm.querySelector('input,select')?.focus();
}
const field = (name, labelText, type, value = '', extra = '') => `<label class="field">${labelText}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
function editClient(row) {
  openEditor(row ? 'Edit client' : 'Add client', field('name','Full name','text',row?.name,'required maxlength="100"') + field('email','Email','email',row?.email) + field('phone','Phone','tel',row?.phone) + (row ? `<label class="field">Status<select name="status">${['active','inactive','waitlist'].map(status => `<option ${row.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label>` : ''), async form => {
    const body = Object.fromEntries(form.entries());
    await api(`clients${row ? `/${row.id}` : ''}`, { method: row ? 'PUT' : 'POST', body: JSON.stringify(body) });
  });
}
function editAppointment(row) {
  if (!state.data.clients.length) { message('Add a client first'); editClient(); return; }
  const clientOptions = state.data.clients.map(client => `<option value="${esc(client.id)}" ${row?.client_id === client.id ? 'selected' : ''}>${esc(client.name)}</option>`).join('');
  openEditor(row ? 'Edit appointment' : 'Add appointment', `<label class="field">Client<select name="client_id">${clientOptions}</select></label>` + field('date','Date','date',row?.date || state.date,'required') + field('time','Time','time',row?.time || '09:00','required') + field('service','Service','text',row?.service || 'Session','required') + field('duration','Minutes','number',row?.duration || 50,'min="15" max="180"') + (row ? `<label class="field">Status<select name="status">${['scheduled','completed','cancelled','no_show'].map(status => `<option value="${status}" ${row.status === status ? 'selected' : ''}>${status.replace('_',' ')}</option>`).join('')}</select></label>` : field('repeatWeeks','Repeat weekly (weeks)','number',1,'min="1" max="12"')), async form => {
    const body = Object.fromEntries(form.entries());
    await api(`appointments${row ? `/${row.id}` : ''}`, { method: row ? 'PUT' : 'POST', body: JSON.stringify(body) });
  });
  if (row) {
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button'; deleteButton.className = 'ghost danger'; deleteButton.textContent = 'Delete appointment';
    editorForm.querySelector('.form-actions').append(deleteButton);
    deleteButton.addEventListener('click', async () => {
      if (!confirm('Delete this appointment permanently?')) return;
      try { await api(`appointments/${row.id}`, { method: 'DELETE' }); editor.close(); await refresh(); message('Appointment deleted'); }
      catch (error) { message(error.message); }
    });
  }
}
document.getElementById('navigation').addEventListener('click', event => { const button = event.target.closest('[data-view]'); if (!button) return; state.page = button.dataset.view; render(); document.getElementById('main').focus(); });
view.addEventListener('click', async event => {
  const button = event.target.closest('[data-action]'); if (!button) return;
  const action = button.dataset.action, id = button.dataset.id;
  if (action === 'reload') return refresh();
  if (action === 'new-client') return editClient();
  if (action === 'edit-client') return editClient(state.data.clients.find(row => row.id === id));
  if (action === 'new-appointment') return editAppointment();
  if (action === 'edit-appointment') return editAppointment(state.data.appointments.find(row => row.id === id));
  if (action === 'today') { state.date = localToday(); return render(); }
  if (action === 'prev' || action === 'next') {
    if (state.mode === 'week') state.date = addDays(state.date, action === 'prev' ? -7 : 7);
    else { const d = day(`${state.date.slice(0,7)}-01`); d.setUTCMonth(d.getUTCMonth() + (action === 'prev' ? -1 : 1)); state.date = iso(d); }
    return render();
  }
  if (action === 'logout') { await authApi('logout', { method: 'POST' }); state.data = null; await renderSignIn(); return; }
  if (action === 'mode') { state.mode = button.dataset.mode; return render(); }
  if (action === 'export') { window.location.href = '/api/admin/export'; return; }
  if (action === 'delete-client') {
    const client = state.data.clients.find(row => row.id === id);
    if (!confirm(`Delete ${client.name} and all their appointments? This cannot be undone.`)) return;
    try { await api(`clients/${id}`, { method: 'DELETE' }); await refresh(); message('Client deleted'); } catch (error) { message(error.message); }
  }
  if (action === 'request-accept' || action === 'request-decline') {
    const status = action === 'request-accept' ? 'accepted' : 'declined';
    if (!confirm(`${status === 'accepted' ? 'Accept' : 'Decline'} this request? No email will be sent yet.`)) return;
    try { await api(`requests/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }); await refresh(); message(`Request ${status}`); } catch (error) { message(error.message); }
  }
});
view.addEventListener('change', async event => {
  if (event.target.id === 'jumpDate') { state.date = event.target.value; render(); }
  if (event.target.id === 'importFile' && event.target.files[0]) {
    try {
      const file = event.target.files[0];
      if (file.size > 1000000) throw new Error('Backup exceeds 1 MB');
      const backup = JSON.parse(await file.text());
      if (!confirm(`Replace all current practice data with ${backup.clients?.length || 0} clients and ${backup.appointments?.length || 0} appointments from this backup?`)) return;
      await api('import', { method: 'POST', body: JSON.stringify(backup) });
      await refresh(); message('Backup imported');
    } catch (error) { message(error.message); }
  }
});
view.addEventListener('submit', async event => {
  if (event.target.id !== 'settingsForm') return;
  event.preventDefault();
  const form = new FormData(event.target);
  const services = String(form.get('services')).split('\n').map(line => { const [name, duration] = line.split(','); return { name: name?.trim(), duration: Number(duration) || 50 }; }).filter(row => row.name);
  const availability = {};
  for (let i = 0; i < 7; i++) availability[i] = String(form.get(`day-${i}`) || '').split(',').map(value => value.trim()).filter(Boolean);
  const data = { name: form.get('name'), practitioner: form.get('practitioner'), email: form.get('email'), location: form.get('location'), timezone: form.get('timezone'), services, availability, bookingEnabled: form.has('bookingEnabled') };
  try { await api('practice', { method: 'PUT', body: JSON.stringify(data) }); await refresh(); message('Practice settings saved'); } catch (error) { message(error.message); }
});
editorForm.addEventListener('click', event => { if (event.target.id === 'closeEditor') editor.close(); });
document.getElementById('logoutButton').addEventListener('click', async () => { try { await authApi('logout', { method: 'POST' }); state.data = null; await renderSignIn(); } catch (error) { message(error.message); } });
refresh();
