const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
});
const bad = (message, status = 400) => json({ error: message }, status);
const id = () => crypto.randomUUID();
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
const validTime = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '');
const clean = (value, max = 160) => String(value || '').trim().slice(0, max);
const emailOK = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const parse = value => { try { return JSON.parse(value); } catch { return null; } };
const encode = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
const decode = text => Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - text.length % 4) % 4)), c => c.charCodeAt(0));
const randomToken = () => encode(crypto.getRandomValues(new Uint8Array(32)));
const hashText = async text => encode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))));
async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: decode(salt), iterations: 150000, hash: 'SHA-256' }, key, 256);
  return encode(new Uint8Array(bits));
}
async function session(request, db) {
  const token = (request.headers.get('cookie') || '').match(/(?:^|;\s*)__Host-daybook_session=([^;]+)/)?.[1];
  if (!token) return null;
  return db.prepare('SELECT token_hash FROM admin_sessions WHERE token_hash=? AND expires_at>CURRENT_TIMESTAMP').bind(await hashText(token)).first();
}
async function startSession(db) {
  const token = randomToken();
  const expiry = new Date(Date.now() + 7 * 86400000).toISOString();
  await db.prepare('INSERT INTO admin_sessions(token_hash,expires_at) VALUES(?,?)').bind(await hashText(token), expiry).run();
  const response = json({ signedIn: true });
  response.headers.set('set-cookie', `__Host-daybook_session=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=604800`);
  return response;
}
async function authRoute(request, env, parts) {
  const db = env.DB;
  const user = await db.prepare('SELECT * FROM admin_user WHERE id=1').first();
  if (parts[0] === 'status' && request.method === 'GET') return json({ setupRequired: !user, signedIn: !!await session(request, db), adminEmail: env.ADMIN_EMAIL });
  if (parts[0] === 'setup' && request.method === 'POST') {
    if (user) return bad('Admin account already exists', 409);
    if (!env.ADMIN_SETUP_TOKEN || !env.ADMIN_EMAIL) return bad('Account setup is unavailable', 503);
    const data = await input(request), password = String(data.password || '');
    if (await hashText(String(data.setupToken || '')) !== await hashText(env.ADMIN_SETUP_TOKEN)) return bad('Invalid setup code', 403);
    if (password.length < 14 || password.length > 128) return bad('Use a password of 14 to 128 characters');
    const salt = randomToken();
    try { await db.prepare('INSERT INTO admin_user(id,email,password_salt,password_hash) VALUES(1,?,?,?)').bind(env.ADMIN_EMAIL.toLowerCase(), salt, await passwordHash(password, salt)).run(); }
    catch { return bad('Admin account already exists', 409); }
    return startSession(db);
  }
  if (parts[0] === 'login' && request.method === 'POST') {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const windowStart = new Date(Math.floor(Date.now() / 3600000) * 3600000).toISOString();
    const key = `${await hashText(ip)}:${windowStart}`;
    await db.prepare('INSERT INTO login_attempts(key,window_start,attempts) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1').bind(key, windowStart).run();
    const limit = await db.prepare('SELECT attempts FROM login_attempts WHERE key=?').bind(key).first();
    if (limit.attempts > 10) return bad('Too many sign-in attempts. Try again later.', 429);
    const data = await input(request);
    if (!user || clean(data.email, 160).toLowerCase() !== user.email || await passwordHash(String(data.password || ''), user.password_salt) !== user.password_hash) return bad('Email or password is incorrect', 401);
    return startSession(db);
  }
  if (parts[0] === 'logout' && request.method === 'POST') {
    const token = (request.headers.get('cookie') || '').match(/(?:^|;\s*)__Host-daybook_session=([^;]+)/)?.[1];
    if (token) await db.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await hashText(token)).run();
    const response = json({ signedOut: true });
    response.headers.set('set-cookie', '__Host-daybook_session=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0');
    return response;
  }
  return bad('Not found', 404);
}

function practiceRow(row) {
  return {
    name: row.name, practitioner: row.practitioner, email: row.email,
    location: row.location, timezone: row.timezone,
    services: parse(row.services_json) || [],
    availability: parse(row.availability_json) || {},
    bookingEnabled: !!row.booking_enabled
  };
}

async function getPractice(db) {
  return practiceRow(await db.prepare('SELECT * FROM practice WHERE id = 1').first());
}

function slotsFor(practice, date) {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return practice.availability[String(weekday)] || [];
}

async function available(db, practice, date) {
  const all = slotsFor(practice, date);
  const { results } = await db.prepare("SELECT time FROM appointments WHERE date = ? AND status != 'cancelled' UNION SELECT time FROM booking_requests WHERE date = ? AND status = 'pending'").bind(date, date).all();
  const busy = new Set(results.map(row => row.time));
  const now = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: practice.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(part => [part.type, part.value]));
  const current = `${now.year}-${now.month}-${now.day}T${now.hour}:${now.minute}`;
  return all.filter(time => !busy.has(time) && `${date}T${time}` > current);
}

async function input(request) {
  const text = await request.text();
  if (text.length > 1000000) throw new Error('Request is too large');
  return JSON.parse(text);
}

function normalizePractice(data) {
  const services = Array.isArray(data.services) ? data.services.slice(0, 8).map(row => ({ name: clean(row.name, 60), duration: Math.max(15, Math.min(180, Number(row.duration) || 50)) })).filter(row => row.name) : [];
  const availability = {};
  for (let day = 0; day < 7; day++) {
    const times = data.availability?.[String(day)];
    availability[day] = Array.isArray(times) ? [...new Set(times.filter(validTime))].sort().slice(0, 24) : [];
  }
  return {
    name: clean(data.name, 80), practitioner: clean(data.practitioner, 80),
    email: clean(data.email, 160), location: clean(data.location, 120),
    timezone: clean(data.timezone, 80) || 'UTC', services, availability,
    bookingEnabled: !!data.bookingEnabled
  };
}

async function publicRoute(request, env, parts, url) {
  const db = env.DB;
  if (request.method === 'GET' && parts[0] === 'practice') {
    const p = await getPractice(db);
    return json({ name: p.name, practitioner: p.practitioner, location: p.location, timezone: p.timezone, services: p.services, bookingEnabled: p.bookingEnabled });
  }
  if (request.method === 'GET' && parts[0] === 'availability') {
    const date = url.searchParams.get('date');
    if (!validDate(date)) return bad('Choose a valid date');
    const p = await getPractice(db);
    if (!p.bookingEnabled) return bad('Online booking is not open', 403);
    return json({ date, times: await available(db, p, date) });
  }
  if (request.method === 'POST' && parts[0] === 'requests') {
    const p = await getPractice(db);
    if (!p.bookingEnabled) return bad('Online booking is not open', 403);
    const data = await input(request);
    if (data.website) return json({ received: true });
    const name = clean(data.name, 100), email = clean(data.email, 160).toLowerCase();
    const date = clean(data.date, 10), time = clean(data.time, 5), service = clean(data.service, 60);
    if (name.length < 2 || !emailOK(email) || !validDate(date) || !validTime(time) || !p.services.some(row => row.name === service)) return bad('Check the request details');
    const todayParts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: p.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(part => [part.type, part.value]));
    const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
    if (date < today || date > new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)) return bad('Choose a date within the next 90 days');
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip)))).map(n => n.toString(16).padStart(2, '0')).join('');
    const windowStart = new Date(Math.floor(Date.now() / 3600000) * 3600000).toISOString();
    const limitKey = `${digest}:${windowStart}`;
    await db.prepare('INSERT INTO request_limits(key,window_start,attempts) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1').bind(limitKey, windowStart).run();
    const limit = await db.prepare('SELECT attempts FROM request_limits WHERE key=?').bind(limitKey).first();
    if (limit.attempts > 6) return bad('Too many requests. Try again later.', 429);
    if (!(await available(db, p, date)).includes(time)) return bad('That time is no longer available', 409);
    try {
      await db.prepare('INSERT INTO booking_requests(id,name,email,date,time,service) VALUES(?,?,?,?,?,?)').bind(id(), name, email, date, time, service).run();
    } catch { return bad('That time is no longer available', 409); }
    return json({ received: true, message: 'Your request is saved. The practice will review it.' }, 201);
  }
  return bad('Not found', 404);
}

async function adminRoute(request, env, parts, url) {
  const db = env.DB;
  if (parts[0] === 'bootstrap' && request.method === 'GET') {
    if ((request.headers.get('accept') || '').includes('text/html')) return Response.redirect(new URL('/', request.url), 302);
    const [practice, clients, appointments, requests] = await Promise.all([
      getPractice(db),
      db.prepare('SELECT * FROM clients ORDER BY name').all(),
      db.prepare('SELECT * FROM appointments ORDER BY date,time').all(),
      db.prepare('SELECT * FROM booking_requests ORDER BY created_at DESC').all()
    ]);
    return json({ practice, clients: clients.results, appointments: appointments.results, requests: requests.results });
  }
  if (parts[0] === 'practice' && request.method === 'PUT') {
    const p = normalizePractice(await input(request));
    if (!p.name || !p.practitioner || !emailOK(p.email) || !p.services.length) return bad('Complete the practice name, practitioner, email, and a service');
    try { new Intl.DateTimeFormat('en', { timeZone: p.timezone }); } catch { return bad('Choose a valid timezone'); }
    await db.prepare('UPDATE practice SET name=?, practitioner=?, email=?, location=?, timezone=?, services_json=?, availability_json=?, booking_enabled=?, updated_at=CURRENT_TIMESTAMP WHERE id=1')
      .bind(p.name, p.practitioner, p.email, p.location, p.timezone, JSON.stringify(p.services), JSON.stringify(p.availability), Number(p.bookingEnabled)).run();
    return json({ practice: p });
  }
  if (parts[0] === 'clients') {
    if (request.method === 'POST') {
      const data = await input(request), name = clean(data.name, 100), email = clean(data.email, 160), phone = clean(data.phone, 60);
      if (name.length < 2 || (email && !emailOK(email))) return bad('Check the client details');
      const client = { id: id(), name, email, phone, status: 'active' };
      await db.prepare('INSERT INTO clients(id,name,email,phone,status) VALUES(?,?,?,?,?)').bind(client.id, name, email, phone, client.status).run();
      return json({ client }, 201);
    }
    if (parts[1] && request.method === 'PUT') {
      const data = await input(request), name = clean(data.name, 100), email = clean(data.email, 160), phone = clean(data.phone, 60), status = clean(data.status, 20);
      if (name.length < 2 || (email && !emailOK(email)) || !['active','inactive','waitlist'].includes(status)) return bad('Check the client details');
      const result = await db.prepare('UPDATE clients SET name=?,email=?,phone=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(name,email,phone,status,parts[1]).run();
      return result.meta.changes ? json({ updated: true }) : bad('Client not found', 404);
    }
    if (parts[1] && request.method === 'DELETE') {
      const result = await db.prepare('DELETE FROM clients WHERE id=?').bind(parts[1]).run();
      return result.meta.changes ? json({ deleted: true }) : bad('Client not found', 404);
    }
  }
  if (parts[0] === 'appointments') {
    if (request.method === 'POST' || (request.method === 'PUT' && parts[1])) {
      const data = await input(request);
      const clientId = clean(data.client_id, 80), date = clean(data.date, 10), time = clean(data.time, 5), service = clean(data.service, 60) || 'Session';
      const duration = Math.max(15, Math.min(180, Number(data.duration) || 50));
      const status = clean(data.status, 20) || 'scheduled';
      if (!validDate(date) || !validTime(time) || !['scheduled','completed','cancelled','no_show'].includes(status) || !await db.prepare('SELECT id FROM clients WHERE id=?').bind(clientId).first()) return bad('Check the appointment details');
      try {
        if (request.method === 'POST') {
          const appointmentId = id(), repeat = Math.min(12, Math.max(1, Number(data.repeatWeeks) || 1)), seriesId = repeat > 1 ? id() : null;
          const statements = [];
          for (let week = 0; week < repeat; week++) {
            const day = new Date(`${date}T12:00:00Z`); day.setUTCDate(day.getUTCDate() + week * 7);
            statements.push(db.prepare('INSERT INTO appointments(id,client_id,date,time,duration,service,status,series_id) VALUES(?,?,?,?,?,?,?,?)')
              .bind(week ? id() : appointmentId, clientId, day.toISOString().slice(0, 10), time, duration, service, status, seriesId));
          }
          await db.batch(statements);
          return json({ id: appointmentId, created: repeat }, 201);
        }
        const result = await db.prepare('UPDATE appointments SET client_id=?,date=?,time=?,duration=?,service=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
          .bind(clientId,date,time,duration,service,status,parts[1]).run();
        return result.meta.changes ? json({ updated: true }) : bad('Appointment not found', 404);
      } catch { return bad('That time is already booked', 409); }
    }
    if (request.method === 'DELETE' && parts[1]) {
      const result = await db.prepare('DELETE FROM appointments WHERE id=?').bind(parts[1]).run();
      return result.meta.changes ? json({ deleted: true }) : bad('Appointment not found', 404);
    }
  }
  if (parts[0] === 'requests' && request.method === 'PUT' && parts[1]) {
    const data = await input(request), status = clean(data.status, 20);
    if (!['accepted','declined'].includes(status)) return bad('Choose accept or decline');
    const row = await db.prepare("SELECT * FROM booking_requests WHERE id=? AND status='pending'").bind(parts[1]).first();
    if (!row) return bad('Request not found', 404);
    if (status === 'declined') {
      await db.prepare("UPDATE booking_requests SET status='declined',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(parts[1]).run();
      return json({ updated: true });
    }
    const existing = await db.prepare('SELECT id FROM clients WHERE lower(email)=?').bind(row.email.toLowerCase()).first();
    const clientId = existing?.id || id();
    try {
      const statements = [];
      if (!existing) statements.push(db.prepare('INSERT INTO clients(id,name,email) VALUES(?,?,?)').bind(clientId,row.name,row.email));
      statements.push(db.prepare('INSERT INTO appointments(id,client_id,date,time,duration,service,status) VALUES(?,?,?,?,?,?,?)').bind(id(),clientId,row.date,row.time,50,row.service,'scheduled'));
      statements.push(db.prepare("UPDATE booking_requests SET status='accepted',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'").bind(row.id));
      await db.batch(statements);
    } catch { return bad('The time is no longer available', 409); }
    return json({ updated: true });
  }
  if (parts[0] === 'export' && request.method === 'GET') {
    const [practice, clients, appointments, requests] = await Promise.all([
      getPractice(db), db.prepare('SELECT * FROM clients').all(), db.prepare('SELECT * FROM appointments').all(), db.prepare('SELECT * FROM booking_requests').all()
    ]);
    return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), practice, clients: clients.results, appointments: appointments.results, requests: requests.results }, null, 2), {
      headers: { 'content-type': 'application/json', 'content-disposition': 'attachment; filename="daybook-export.json"', 'cache-control': 'no-store' }
    });
  }
  if (parts[0] === 'import' && request.method === 'POST') {
    const data = await input(request);
    const clients = data.clients, appointments = data.appointments, requests = data.requests;
    if (!Array.isArray(clients) || !Array.isArray(appointments) || !Array.isArray(requests) || !data.practice || clients.length > 300 || appointments.length > 500 || requests.length > 300) return bad('Choose a valid Daybook export with at most 300 clients, 500 appointments, and 300 requests');
    const p = normalizePractice(data.practice);
    if (!p.name || !p.practitioner || !emailOK(p.email) || !p.services.length) return bad('The backup has an invalid practice profile');
    try { new Intl.DateTimeFormat('en', { timeZone: p.timezone }); } catch { return bad('The backup has an invalid timezone'); }
    const uuid = value => /^[0-9a-f-]{36}$/i.test(value || '');
    const clientIds = new Set(), activeSlots = new Set(), pendingSlots = new Set();
    for (const row of clients) {
      if (!uuid(row.id) || clientIds.has(row.id) || clean(row.name, 100).length < 2 || (row.email && !emailOK(row.email)) || !['active','inactive','waitlist'].includes(row.status)) return bad('The backup has invalid clients');
      clientIds.add(row.id);
    }
    for (const row of appointments) {
      const slot = `${row.date}T${row.time}`;
      if (!uuid(row.id) || !clientIds.has(row.client_id) || !validDate(row.date) || !validTime(row.time) || !['scheduled','completed','cancelled','no_show'].includes(row.status) || (row.status !== 'cancelled' && activeSlots.has(slot))) return bad('The backup has invalid appointments');
      if (row.status !== 'cancelled') activeSlots.add(slot);
    }
    for (const row of requests) {
      const slot = `${row.date}T${row.time}`;
      if (!uuid(row.id) || clean(row.name, 100).length < 2 || !emailOK(row.email) || !validDate(row.date) || !validTime(row.time) || !['pending','accepted','declined'].includes(row.status) || (row.status === 'pending' && (pendingSlots.has(slot) || activeSlots.has(slot)))) return bad('The backup has invalid requests');
      if (row.status === 'pending') pendingSlots.add(slot);
    }
    const statements = [
      db.prepare('DELETE FROM booking_requests'), db.prepare('DELETE FROM appointments'), db.prepare('DELETE FROM clients'),
      db.prepare('UPDATE practice SET name=?,practitioner=?,email=?,location=?,timezone=?,services_json=?,availability_json=?,booking_enabled=?,updated_at=CURRENT_TIMESTAMP WHERE id=1').bind(p.name,p.practitioner,p.email,p.location,p.timezone,JSON.stringify(p.services),JSON.stringify(p.availability),Number(p.bookingEnabled))
    ];
    for (const row of clients) statements.push(db.prepare('INSERT INTO clients(id,name,email,phone,status) VALUES(?,?,?,?,?)').bind(row.id,clean(row.name,100),clean(row.email,160),clean(row.phone,60),row.status));
    for (const row of appointments) statements.push(db.prepare('INSERT INTO appointments(id,client_id,date,time,duration,service,status,series_id) VALUES(?,?,?,?,?,?,?,?)').bind(row.id,row.client_id,row.date,row.time,Math.max(15,Math.min(180,Number(row.duration)||50)),clean(row.service,60),row.status,row.series_id||null));
    for (const row of requests) statements.push(db.prepare('INSERT INTO booking_requests(id,name,email,date,time,service,status) VALUES(?,?,?,?,?,?,?)').bind(row.id,clean(row.name,100),clean(row.email,160),row.date,row.time,clean(row.service,60),row.status));
    try { await db.batch(statements); } catch { return bad('The backup could not be imported', 409); }
    return json({ imported: true, clients: clients.length, appointments: appointments.length, requests: requests.length });
  }
  return bad('Not found', 404);
}

export async function onRequest({ request, env }) {
  try {
    if (!env.DB) return bad('Database is not configured', 503);
    const url = new URL(request.url);
    if (!['GET', 'HEAD'].includes(request.method) && request.headers.get('origin') !== url.origin) return bad('Invalid request origin', 403);
    const parts = url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean);
    const area = parts.shift();
    if (area === 'public') return await publicRoute(request, env, parts, url);
    if (area === 'auth') return await authRoute(request, env, parts);
    if (area !== 'admin' || !await session(request, env.DB)) return bad('Sign in to access this practice', 401);
    return await adminRoute(request, env, parts, url);
  } catch (error) {
    if (error instanceof SyntaxError) return bad('Invalid JSON');
    return bad('The request could not be completed', 500);
  }
}
