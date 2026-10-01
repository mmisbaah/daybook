const root = document.getElementById('bookingView');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
let practice;
const today = () => new Date().toISOString().slice(0, 10);
async function read(url, options) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Could not complete the request');
  return body;
}
async function setup() {
  try {
    practice = await read('/api/public/practice');
    document.title = `Request a time · ${practice.name || 'Daybook'}`;
    if (!practice.bookingEnabled) {
      root.innerHTML = `<div class="card"><span class="eyebrow">DAYBOOK / BOOKING</span><h1>${esc(practice.name || 'Booking')}</h1><p>Online booking is not open yet. Please contact the practice directly.</p></div>`;
      return;
    }
    root.innerHTML = `<div class="card"><span class="eyebrow">DAYBOOK / BOOKING REQUEST</span><h1>Request a time with ${esc(practice.practitioner)}</h1><p class="intro">${esc(practice.name)}${practice.location ? ` · ${esc(practice.location)}` : ''}. Choose a time and send a request. The practice will review it before confirming an appointment.</p><form id="bookingForm"><div class="form-grid"><label class="field">Service<select name="service" required>${practice.services.map(row => `<option value="${esc(row.name)}">${esc(row.name)} · ${esc(row.duration)} min</option>`).join('')}</select></label><label class="field">Preferred date<input type="date" name="date" id="date" min="${today()}" required></label><label class="field">Available times<select name="time" id="time" required disabled><option>Choose a date first</option></select></label><label class="field">Your name<input name="name" autocomplete="name" required maxlength="100"></label><label class="field wide">Email for the practice to contact you<input type="email" name="email" autocomplete="email" required maxlength="160"></label><label class="field" style="position:absolute;left:-9999px" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label></div><p id="bookingError" class="warning" role="alert" hidden></p><div class="form-actions"><button class="primary" type="submit">Send request</button></div></form></div><footer>Submitting a request does not confirm a session. Do not include medical or emergency information in this form.</footer>`;
    document.getElementById('date').max = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
  } catch (error) { root.innerHTML = `<div class="empty"><h1>Booking is unavailable</h1><p>${esc(error.message)}</p></div>`; }
}
root.addEventListener('change', async event => {
  if (event.target.id !== 'date') return;
  const select = document.getElementById('time');
  select.disabled = true; select.innerHTML = '<option>Checking times…</option>';
  try {
    const result = await read(`/api/public/availability?date=${encodeURIComponent(event.target.value)}`);
    select.innerHTML = result.times.length ? `<option value="">Choose a time</option>${result.times.map(time => `<option value="${esc(time)}">${esc(time)} (${esc(practice.timezone)})</option>`).join('')}` : '<option value="">No times on this date</option>';
    select.disabled = !result.times.length;
  } catch (error) { select.innerHTML = '<option value="">Could not load times</option>'; document.getElementById('bookingError').textContent = error.message; document.getElementById('bookingError').hidden = false; }
});
root.addEventListener('submit', async event => {
  if (event.target.id !== 'bookingForm') return;
  event.preventDefault();
  const form = event.target, button = form.querySelector('[type=submit]'), errorBox = document.getElementById('bookingError');
  button.disabled = true; errorBox.hidden = true;
  try {
    const body = Object.fromEntries(new FormData(form).entries());
    const result = await read('/api/public/requests', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    root.innerHTML = `<div class="card success"><h1>Request received</h1><p>${esc(result.message)}</p><p>The time is held while the practice reviews your request. No appointment is confirmed yet.</p></div>`;
  } catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; button.disabled = false; }
});
setup();
