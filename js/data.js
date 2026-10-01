/* ============================================================
   DAYBOOK — practice data (Fairlight Counseling)
   Everything here is deliberately domain-specific: cadence,
   insurance, intake documents, cancellation policy, caseload.
   ============================================================ */

var DB = (function () {
  'use strict';

  var practice = {
    name: 'Fairlight Counseling',
    clinician: 'Naomi Okafor, LMFT',
    pronouns: 'she/her',
    initials: 'NO',
    license: 'OR #T-11482',
    city: 'Portland, OR',
    tz: 'PT',
    url: 'fairlight.daybook.app/naomi',
    phone: '(503) 555-0142',
    caseload: 18,
    cap: 20,
    disclaimer: 'Not for emergencies — call or text 988.'
  };

  /* --- the day --- */
  var week = [
    { d: 'Sun', n: 27, load: 0 },
    { d: 'Mon', n: 28, load: 5 },
    { d: 'Tue', n: 29, load: 7 },
    { d: 'Wed', n: 30, load: 6, today: true },
    { d: 'Thu', n: 1,  load: 7, full: true },
    { d: 'Fri', n: 2,  load: 4 },
    { d: 'Sat', n: 3,  load: 0 }
  ];

  var clients = [
    {
      id: 'marisol', name: 'Marisol Reyes', pronouns: 'she/her', status: 'active',
      cadence: 'Weekly', since: 'Mar 2025', slot: 'Wed 9:00 AM', slotLong: 'Wednesdays, 9:00 AM',
      modality: 'Telehealth', next: 'Today, 9:00 AM', last: 'Sep 23',
      insurance: { carrier: 'Aetna', state: 'verified', copay: '$30', member: 'W2381 00451' },
      balance: '$0',
      focus: ['Work transition', 'Sleep', 'Perfectionism'],
      flags: [],
      prep: 'New role started Sep 22. Bring back the sleep-hygiene plan and the 3-night log — she promised the log before she believed it would help.',
      docs: { intake: 'ok', consent: 'ok', phq9: 'ok' },
      scores: { phq: '12', gad: '9', trend: '↓ 4 pts since Aug' },
      contact: 'SMS · (503) 555-0177',
      history: [
        { d: 'Sep 23', t: 'Reviewed sleep log — interrupted sleep 4/7 nights since start date. Assigned stimulus-control experiment.', m: 'Note signed · 50 min · video' },
        { d: 'Sep 16', t: 'Role-transition anxiety. Started values worksheet on “enoughness”.', m: 'Note signed · 50 min · video' },
        { d: 'Sep 9',  t: 'PHQ-9 16 → 12. Reports reduced Sunday dread.', m: 'Note signed · 50 min · video' }
      ],
      wait: null
    },
    {
      id: 'dev', name: 'Dev Patel', pronouns: 'he/him', status: 'intake',
      cadence: 'Weekly', since: 'Today', slot: 'Wed 10:00 AM', slotLong: 'Wednesdays, 10:00 AM',
      modality: 'In-person', next: 'Today, 10:00 AM', last: '—',
      insurance: { carrier: 'Self-pay', state: 'self', copay: '$185', member: '—' },
      balance: '$0',
      focus: ['Anxiety', 'First time in therapy'],
      flags: [{ tone: 'gold', ic: 'file', text: '<b>Intake not returned.</b> PHQ-9 + history form sent Sep 27, still outstanding — budget 10 min before the session.' }],
      prep: 'First session. Nothing on file beyond the enquiry call. Start with the treatment agreement, then let him lead — he flagged “not sure this is for me” on the form.',
      docs: { intake: 'due', consent: 'ok', phq9: 'due' },
      scores: { phq: '—', gad: '—', trend: 'baseline not taken' },
      contact: 'SMS · (971) 555-0104',
      history: [],
      wait: null
    },
    {
      id: 'priya', name: 'Priya Raman', pronouns: 'she/her', status: 'active',
      cadence: 'Weekly', since: 'Jan 2025', slot: 'Wed 2:00 PM', slotLong: 'Wednesdays, 2:00 PM',
      modality: 'In-person', next: 'Today, 2:00 PM', last: 'Sep 23',
      insurance: { carrier: 'BCBS', state: 'verified', copay: '$25', member: 'BC 77120 44' },
      balance: '$0',
      focus: ['Trauma (EMDR)', 'Grief', 'Sleep'],
      flags: [],
      prep: 'Phase 3 — target memory “hospital corridor, March”. Resource installation is stable; 10 min container exercise before the bilateral set.',
      docs: { intake: 'ok', consent: 'ok', phq9: 'ok' },
      scores: { phq: '9', gad: '11', trend: '↓ 3 pts since Aug' },
      contact: 'Email · priya.r@mailbox.com',
      history: [
        { d: 'Sep 23', t: 'Completed bilateral set 3. SUDS 8 → 3. Container visualisation held between sessions.', m: 'Note signed · 50 min · in person' },
        { d: 'Sep 16', t: 'Resource installation — safe-place and container. No target work.', m: 'Note signed · 50 min · in person' }
      ],
      wait: null
    },
    {
      id: 'theo', name: 'Theo Brandt', pronouns: 'he/him', status: 'active',
      cadence: 'Weekly', since: 'Jun 2026', slot: 'Wed 3:00 PM', slotLong: 'Wednesdays, 3:00 PM',
      modality: 'Telehealth', next: 'Today, 3:00 PM', last: 'Sep 23',
      insurance: { carrier: 'Self-pay', state: 'self', copay: '$150', member: '—' },
      balance: '$150',
      focus: ['Burnout', 'Irritability'],
      flags: [{ tone: 'clay', ic: 'alert', text: '<b>2 late cancellations this month.</b> Policy fees applied Sep 9 and Sep 23. 24-hour reminder is set — confirm it lands on the right number.' }],
      prep: 'Keep the first 5 min for the attendance conversation before you go anywhere near the burnout scale. He responds well to being spoken to plainly.',
      docs: { intake: 'ok', consent: 'ok', phq9: 'ok' },
      scores: { phq: '14', gad: '13', trend: 'no change' },
      contact: 'SMS · (503) 555-0119 · wrong number on file since Sep 16',
      history: [
        { d: 'Sep 23', t: 'Late cancellation (38 min notice). Fee applied per agreement §4.', m: 'No session held' },
        { d: 'Sep 16', t: 'Explored “rest is earned” belief. Agreed to 10-min transition ritual after shifts.', m: 'Note signed · 50 min · video' }
      ],
      wait: null
    },
    {
      id: 'hannah', name: 'Hannah Kim', pronouns: 'she/her', status: 'active',
      cadence: 'Every 2 weeks', since: 'Nov 2024', slot: 'Wed 4:00 PM', slotLong: 'Alternate Wednesdays, 4:00 PM',
      modality: 'In-person', next: 'Today, 4:00 PM', last: 'Sep 16',
      insurance: { carrier: 'United', state: 'verified', copay: '$40', member: 'UHC 33019 7B' },
      balance: '$40',
      focus: ['Mood', 'Safety planning', 'Family'],
      flags: [
        { tone: 'rose', ic: 'shield', text: '<b>Safety plan on file · reviewed Sep 2.</b> Review at every session. Emergency contact: sister, (503) 555-0165.' },
        { tone: 'gold', ic: 'card', text: '<b>$40 copay unpaid</b> — 2 sessions. Card on file expired Aug 30.' }
      ],
      prep: 'Step down from weekly to fortnightly was her idea. Ask what she notices in the 12 days between — that gap is the whole point.',
      docs: { intake: 'ok', consent: 'ok', phq9: 'ok' },
      scores: { phq: '17', gad: '12', trend: '↓ 5 pts since Jul' },
      contact: 'Call only · (503) 555-0133',
      history: [
        { d: 'Sep 16', t: 'Safety plan reviewed and re-signed. PHQ-9 17 (was 22). Agree to step down to fortnightly.', m: 'Note signed · 50 min · in person' },
        { d: 'Sep 2',  t: 'Safety plan created after reporting passive ideation on return to work.', m: 'Note signed · 60 min · in person' }
      ],
      wait: null
    },
    {
      id: 'camille', name: 'Camille Duarte', pronouns: 'she/her', status: 'active',
      cadence: 'Weekly', since: 'Feb 2026', slot: 'Fri 11:00 AM', slotLong: 'Fridays, 11:00 AM',
      modality: 'Telehealth', next: 'Fri, 11:00 AM', last: 'Sep 25',
      insurance: { carrier: 'Aetna', state: 'verified', copay: '$30', member: 'W2381 99017' },
      balance: '$60',
      focus: ['Anxiety', 'Panic'],
      flags: [{ tone: 'clay', ic: 'card', text: '<b>Balance $60</b> — invoice #2041 open 14 days. Aetna paid the session, she owes the copay.' }],
      prep: 'Interoceptive exposure hierarchy — step 2 (stairs) was abandoned last week. Normalise the bail-out before re-running it.',
      docs: { intake: 'ok', consent: 'ok', phq9: 'ok' },
      scores: { phq: '8', gad: '15', trend: '↓ 6 pts since Aug' },
      contact: 'SMS · (971) 555-0188',
      history: [{ d: 'Sep 25', t: 'Step 2 exposure attempted, stopped at SUDS 6. Homework: 1x stair run, 3x/day.', m: 'Note signed · 50 min · video' }],
      wait: null
    },
    {
      id: 'owen', name: 'Owen Brennan', pronouns: 'he/him', status: 'active',
      cadence: 'Every 3 weeks', since: 'Aug 2025', slot: 'Thu 8:30 AM', slotLong: 'Thursdays, 8:30 AM',
      modality: 'In-person', next: 'Thu, 8:30 AM', last: 'Sep 17',
      insurance: { carrier: 'BCBS', state: 'verified', copay: '$25', member: 'BC 44810 02' },
      balance: '$0',
      focus: ['ADHD', 'Executive function'],
      flags: [],
      prep: 'Maintenance phase — 3-week cadence holding since June. Review the body-double routine, then discharge to quarterly check-ins if it holds.',
      docs: { intake: 'ok', consent: 'ok', phq9: 'ok' },
      scores: { phq: '5', gad: '6', trend: 'stable' },
      contact: 'Email · o.brennan@mailbox.com',
      history: [{ d: 'Sep 17', t: 'Third week of planner habit without prompting. Consider tapering.', m: 'Note signed · 50 min · in person' }],
      wait: null
    },
    {
      id: 'nadia', name: 'Nadia Farouk', pronouns: 'she/her', status: 'intake',
      cadence: 'Weekly', since: 'Sep 2026', slot: 'Mon 2:00 PM', slotLong: 'Mondays, 2:00 PM',
      modality: 'Telehealth', next: 'Mon, 2:00 PM', last: 'Sep 21',
      insurance: { carrier: 'Self-pay', state: 'self', copay: '$185', member: '—' },
      balance: '$185',
      focus: ['Adjustment', 'Migration'],
      flags: [{ tone: 'gold', ic: 'hourglass', text: '<b>History form 6 days overdue.</b> Session 3 of the opening block — treatment plan cannot be signed without it.' }],
      prep: 'Third session. Treatment plan due: she has named “belonging” but not a single measurable goal yet.',
      docs: { intake: 'due', consent: 'ok', phq9: 'ok' },
      scores: { phq: '13', gad: '10', trend: '↓ 2 pts' },
      contact: 'SMS · (971) 555-0142',
      history: [{ d: 'Sep 21', t: 'Explored homesickness vs grief. Two cultures, one window.', m: 'Note signed · 50 min · video' }],
      wait: null
    },
    {
      id: 'grace', name: 'Grace Lindqvist', pronouns: 'she/her', status: 'active',
      cadence: 'Every 2 weeks', since: 'Apr 2026', slot: 'Tue 4:30 PM', slotLong: 'Alternate Tuesdays, 4:30 PM',
      modality: 'Telehealth', next: 'Tue, 4:30 PM', last: 'Sep 22',
      insurance: { carrier: 'United', state: 'pending', copay: '$40', member: 'UHC 88140 2C' },
      balance: '$40',
      focus: ['Postpartum', 'Identity'],
      flags: [{ tone: 'gold', ic: 'shield', text: '<b>Eligibility pending.</b> United confirmation due within 1 business day — collect the $40 copay at the door until then.' }],
      prep: 'Nine months since birth. Ask about the “who am I now” question she wrote down but never read aloud.',
      docs: { intake: 'ok', consent: 'ok', phq9: 'ok' },
      scores: { phq: '11', gad: '8', trend: '↓ 4 pts' },
      contact: 'SMS · (503) 555-0190',
      history: [{ d: 'Sep 22', t: 'Read the note she wrote in the car park. Long pause, then “that’s the session.”', m: 'Note signed · 50 min · video' }],
      wait: null
    },
    {
      id: 'sam', name: 'Sam Whitfield', pronouns: 'he/him', status: 'paused',
      cadence: 'Paused since Aug', since: 'Oct 2024', slot: 'Fri 2:00 PM', slotLong: 'Fridays, 2:00 PM',
      modality: 'Either', next: '—', last: 'Aug 14',
      insurance: { carrier: 'Cigna', state: 'verified', copay: '$35', member: 'CG 55210 91' },
      balance: '$0',
      focus: ['Grief', 'Return to work'],
      flags: [{ tone: 'slate', ic: 'moon', text: '<b>Paused at his request</b> after the June discharge. Wants weekly again — see Requests.' }],
      prep: 'Resuming after 7 weeks. Informed consent expires Nov 2 — re-sign at the first session back.',
      docs: { intake: 'ok', consent: 'due', phq9: 'ok' },
      scores: { phq: '10', gad: '7', trend: 'baseline Aug 14' },
      contact: 'Email · sam.whitfield@mailbox.com',
      history: [{ d: 'Aug 14', t: 'Agreed to pause; six-month grief arc completed. Door left open.', m: 'Note signed · 50 min · video' }],
      wait: null
    },
    {
      id: 'lucia', name: 'Lucia Moreau', pronouns: 'she/her', status: 'active',
      cadence: 'Weekly', since: 'May 2026', slot: 'Thu 11:00 AM', slotLong: 'Thursdays, 11:00 AM',
      modality: 'In-person', next: 'Thu, 11:00 AM', last: 'Sep 24',
      insurance: { carrier: 'Aetna', state: 'verified', copay: '$30', member: 'W2381 22106' },
      balance: '$0', focus: ['Panic', 'Agoraphobia'],
      flags: [],
      prep: 'Interoceptive work step 4 — the bus ride. She did it once unaided last week; celebrate that before troubleshooting.',
      docs: { intake: 'ok', consent: 'ok', phq9: 'ok' },
      scores: { phq: '9', gad: '12', trend: '↓ 7 pts since Jul' },
      contact: 'SMS · (503) 555-0128',
      history: [{ d: 'Sep 24', t: 'Step 4 exposure completed on the No. 14. SUDS peaked at 7, dropped to 3.', m: 'Note signed · 50 min · in person' }],
      wait: null
    },
    {
      id: 'ben', name: 'Ben Ostrowski', pronouns: 'he/him', status: 'active',
      cadence: 'Every 2 weeks', since: 'Sep 2025', slot: 'Mon 9:00 AM', slotLong: 'Alternate Mondays, 9:00 AM',
      modality: 'Telehealth', next: 'Mon, 9:00 AM', last: 'Sep 28',
      insurance: { carrier: 'BCBS', state: 'verified', copay: '$25', member: 'BC 66401 55' },
      balance: '$0', focus: ['ADHD', 'Sleep'],
      flags: [],
      prep: 'Medication review with prescriber went well — he wants to keep therapy focused on the morning routine, not the diagnosis.',
      docs: { intake: 'ok', consent: 'ok', phq9: 'ok' },
      scores: { phq: '6', gad: '7', trend: 'stable' },
      contact: 'Email · b.ostrowski@mailbox.com',
      history: [{ d: 'Sep 28', t: 'Fourth consecutive week of the 20-minute launch routine.', m: 'Note signed · 50 min · video' }],
      wait: null
    },
    {
      id: 'ivy', name: 'Ivy Chen', pronouns: 'she/her', status: 'active',
      cadence: 'Weekly', since: 'Jul 2026', slot: 'Tue 10:00 AM', slotLong: 'Tuesdays, 10:00 AM',
      modality: 'In-person', next: 'Tue, 10:00 AM', last: 'Sep 29',
      insurance: { carrier: 'United', state: 'verified', copay: '$40', member: 'UHC 44127 9A' },
      balance: '$40', focus: ['Grief', 'Bereavement'],
      flags: [{ tone: 'slate', ic: 'moon', text: '<b>Anniversary of her mother’s death is Oct 12.</b> Expect the two weeks before it to be heavier — already blocked a longer session.' }],
      prep: 'Continuing the “empty chair” arc. Do not rush toward meaning-making; she is still angry, and the anger is the work.',
      docs: { intake: 'ok', consent: 'ok', phq9: 'ok' },
      scores: { phq: '13', gad: '8', trend: '↓ 2 pts' },
      contact: 'SMS · (971) 555-0150',
      history: [{ d: 'Sep 29', t: 'Second letter to her mother read aloud. Wept, then laughed at a memory of her mother’s cooking.', m: 'Note signed · 50 min · in person' }],
      wait: null
    },
    {
      id: 'tobi', name: 'Tobi Adeyemi', pronouns: 'they/them', status: 'active',
      cadence: 'Every 3 weeks', since: 'Jan 2026', slot: 'Fri 9:00 AM', slotLong: 'Fridays, 9:00 AM',
      modality: 'Telehealth', next: 'Fri, 9:00 AM', last: 'Sep 18',
      insurance: { carrier: 'Self-pay', state: 'self', copay: '$150', member: '—' },
      balance: '$0', focus: ['Identity', 'Work transition'],
      flags: [],
      prep: 'Tapering to monthly if the next two sessions hold. Ask about the team lead conversation they kept postponing.',
      docs: { intake: 'ok', consent: 'ok', phq9: 'ok' },
      scores: { phq: '7', gad: '6', trend: '↓ 9 pts since Feb' },
      contact: 'SMS · (503) 555-0184',
      history: [{ d: 'Sep 18', t: 'Asked for the promotion without apologising for it. Noted the difference out loud.', m: 'Note signed · 50 min · video' }],
      wait: null
    },
    {
      id: 'rania', name: 'Rania Haddad', pronouns: 'she/her', status: 'active',
      cadence: 'Weekly', since: 'Mar 2026', slot: 'Mon 4:00 PM', slotLong: 'Mondays, 4:00 PM',
      modality: 'In-person', next: 'Mon, 4:00 PM', last: 'Sep 29',
      insurance: { carrier: 'Cigna', state: 'verified', copay: '$35', member: 'CG 70188 24' },
      balance: '$0', focus: ['Trauma (EMDR)', 'Sleep'],
      flags: [],
      prep: 'Phase 2 closed. First target session is next Monday — keep the last 10 minutes free for grounding, no exceptions.',
      docs: { intake: 'ok', consent: 'ok', phq9: 'ok' },
      scores: { phq: '11', gad: '12', trend: '↓ 4 pts' },
      contact: 'Call only · (503) 555-0107',
      history: [{ d: 'Sep 29', t: 'Closed resource installation. Container and safe place both stable across two weeks.', m: 'Note signed · 50 min · in person' }],
      wait: null
    },
    {
      id: 'jonah', name: 'Jonah Feldman', pronouns: 'he/him', status: 'active',
      cadence: 'Weekly', since: 'Aug 2026', slot: 'Tue 2:00 PM', slotLong: 'Tuesdays, 2:00 PM',
      modality: 'Telehealth', next: 'Tue, 2:00 PM', last: 'Sep 29',
      insurance: { carrier: 'Aetna', state: 'verified', copay: '$30', member: 'W2381 63015' },
      balance: '$0', focus: ['Anxiety', 'Compulsions'],
      flags: [{ tone: 'gold', ic: 'gauge', text: '<b>Y-BOCS due.</b> Week 6 of ERP — re-rate before you change the hierarchy.' }],
      prep: 'Response prevention is slipping at bedtime only. Take the hierarchy back one step rather than adding exposure.',
      docs: { intake: 'ok', consent: 'ok', phq9: 'ok' },
      scores: { phq: '10', gad: '16', trend: '↓ 5 pts' },
      contact: 'SMS · (971) 555-0198',
      history: [{ d: 'Sep 29', t: 'Two rituals dropped without replacement. Bedtime checking still at 12 minutes.', m: 'Note signed · 50 min · video' }],
      wait: null
    },
    {
      id: 'freya', name: 'Freya Nilsen', pronouns: 'she/her', status: 'active',
      cadence: 'Every 2 weeks', since: 'Feb 2026', slot: 'Thu 3:00 PM', slotLong: 'Alternate Thursdays, 3:00 PM',
      modality: 'Telehealth', next: 'Thu, 3:00 PM', last: 'Sep 24',
      insurance: { carrier: 'BCBS', state: 'verified', copay: '$25', member: 'BC 51277 60' },
      balance: '$0', focus: ['Burnout', 'Parenting'],
      flags: [],
      prep: 'The “I’m the only one holding it together” line came back. Use the team map exercise she drew in August.',
      docs: { intake: 'ok', consent: 'ok', phq9: 'ok' },
      scores: { phq: '8', gad: '11', trend: '↓ 3 pts' },
      contact: 'SMS · (503) 555-0116',
      history: [{ d: 'Sep 24', t: 'Mapped the household load on one page. Asked partner to read it.', m: 'Note signed · 50 min · video' }],
      wait: null
    },
    {
      id: 'hugo', name: 'Hugo Marchetti', pronouns: 'he/him', status: 'active',
      cadence: 'Weekly', since: 'Jun 2026', slot: 'Mon 11:00 AM', slotLong: 'Mondays, 11:00 AM',
      modality: 'In-person', next: 'Mon, 11:00 AM', last: 'Sep 28',
      insurance: { carrier: 'United', state: 'verified', copay: '$40', member: 'UHC 20884 1D' },
      balance: '$80', focus: ['Adjustment', 'Retirement'],
      flags: [{ tone: 'clay', ic: 'card', text: '<b>Balance $80</b> — two copays behind. Card on file declined Sep 20; ask before the session, not after.' }],
      prep: 'Six weeks since the last working day. The diary he keeps “just in case” is doing more harm than good.',
      docs: { intake: 'ok', consent: 'ok', phq9: 'ok' },
      scores: { phq: '12', gad: '9', trend: '↓ 3 pts' },
      contact: 'Call only · (503) 555-0139',
      history: [{ d: 'Sep 28', t: 'Named the shame of “being useless” for the first time. Sat with it instead of planning around it.', m: 'Note signed · 50 min · in person' }],
      wait: null
    },
    /* ---- waitlist ---- */
    {
      id: 'elena', name: 'Elena Vasquez', pronouns: 'she/her', status: 'waitlist',
      cadence: 'Weekly', since: 'Joined Oct 1', slot: 'Waitlist · Tue/Wed 1–3 PM', slotLong: 'Tue or Wed, 1:00–3:00 PM',
      modality: 'Telehealth', next: 'Waitlisted', last: '—',
      insurance: { carrier: 'Aetna', state: 'verified', copay: '$30', member: 'W2381 77410' },
      balance: '$0',
      focus: ['Anxiety', 'New to practice'],
      flags: [],
      prep: 'Transferred care from a practice that closed. History form + PHQ-9 returned in full — ready to book today.',
      docs: { intake: 'ok', consent: 'ok', phq9: 'ok' },
      scores: { phq: '15', gad: '14', trend: 'intake baseline' },
      contact: 'SMS · (503) 555-0121',
      history: [],
      wait: { waited: '6 days', match: 92, window: 'Tue/Wed · 1–3 PM', reasons: [
        { ok: true, t: 'Aetna <b>verified</b> · $30 copay' },
        { ok: true, t: 'Telehealth — matches the opening' },
        { ok: true, t: 'Wants <b>Wed 1:00 PM</b> exactly' },
        { ok: true, t: 'Weekly cadence · intake complete' }
      ]}
    },
    {
      id: 'marcus', name: 'Marcus Hale', pronouns: 'he/him', status: 'waitlist',
      cadence: 'Weekly', since: 'Joined Oct 3', slot: 'Waitlist · afternoons', slotLong: 'Any weekday afternoon or evening',
      modality: 'Either', next: 'Waitlisted', last: '—',
      insurance: { carrier: 'Self-pay', state: 'self', copay: '$150', member: '—' },
      balance: '$0',
      focus: ['Burnout', 'New to practice'],
      flags: [],
      prep: 'Enquiry call: “sometime after work, I don’t do mornings.” Prefers evenings but says he can make afternoons if given notice.',
      docs: { intake: 'ok', consent: 'due', phq9: 'ok' },
      scores: { phq: '12', gad: '11', trend: 'intake baseline' },
      contact: 'SMS · (971) 555-0166',
      history: [],
      wait: { waited: '3 days', match: 78, window: 'Afternoons · prefers after 5 PM', reasons: [
        { ok: true, t: 'Self-pay — no verification needed' },
        { ok: true, t: 'Telehealth works' },
        { ok: true, t: '1:00 PM <b>outside</b> his preferred 5 PM+ window' },
        { ok: false, t: 'Consent form not signed yet' }
      ]}
    },
    {
      id: 'ruth', name: 'Ruth Oyelaran', pronouns: 'she/her', status: 'waitlist',
      cadence: 'Every 2 weeks', since: 'Joined Sep 25', slot: 'Waitlist · afternoons', slotLong: 'Weekday afternoons',
      modality: 'In-person', next: 'Waitlisted', last: '—',
      insurance: { carrier: 'BCBS', state: 'pending', copay: '$25', member: 'BC 99304 18' },
      balance: '$0',
      focus: ['Chronic illness', 'Adjustment'],
      flags: [],
      prep: 'Asked for the office specifically — “I can’t do therapy from the kitchen table.” Eligibility still pending with BCBS.',
      docs: { intake: 'ok', consent: 'ok', phq9: 'due' },
      scores: { phq: '16', gad: '10', trend: 'PHQ-9 not returned' },
      contact: 'Call only · (503) 555-0155',
      history: [],
      wait: { waited: '11 days', match: 65, window: 'Weekday afternoons', reasons: [
        { ok: true, t: 'Afternoons work' },
        { ok: false, t: 'Opening is <b>telehealth</b> — she asked for in person' },
        { ok: false, t: 'BCBS eligibility <b>still pending</b>' },
        { ok: false, t: 'PHQ-9 not returned' }
      ]}
    },
    {
      id: 'jordan', name: 'Jordan Aleman', pronouns: 'they/them', status: 'waitlist',
      cadence: 'Weekly', since: 'Joined today', slot: 'Waitlist · Thu after 4 PM', slotLong: 'Thursdays after 4:00 PM only',
      modality: 'Telehealth', next: 'Waitlisted', last: '—',
      insurance: { carrier: 'BCBS', state: 'pending', copay: '$25', member: 'BC 11077 3F' },
      balance: '$0',
      focus: ['Anxiety', 'Gender', 'First time in therapy'],
      flags: [],
      prep: 'Booked a consult from the public page and joined the waitlist in the same sitting.',
      docs: { intake: 'due', consent: 'due', phq9: 'due' },
      scores: { phq: '—', gad: '—', trend: 'baseline not taken' },
      contact: 'SMS · (971) 555-0173',
      history: [],
      wait: { waited: 'Today', match: 41, window: 'Thu after 4 PM only', reasons: [
        { ok: true, t: 'Telehealth works' },
        { ok: false, t: 'Wants <b>Thursday evenings</b> — no overlap' },
        { ok: false, t: 'No documents returned' },
        { ok: false, t: 'Eligibility unverified' }
      ]}
    }
  ];

  /* --- Wednesday 30 September 2026, now 12:38 PM --- */
  var timeline = [
    { kind: 'session', t: '9:00',  mer: 'AM', id: 'marisol', state: 'past', note: 'due' },
    { kind: 'session', t: '10:00', mer: 'AM', id: 'dev',      state: 'past', note: 'signed' },
    { kind: 'block',   t: '11:40', mer: 'AM', text: 'Documentation block', dur: '45 min' },
    { kind: 'now',     t: '12:38', mer: 'PM' },
    { kind: 'slot',    t: '1:00',  mer: 'PM', id: 'open-1', dur: '50 min', modality: 'Telehealth' },
    { kind: 'session', t: '2:00',  mer: 'PM', id: 'priya',  state: 'next' },
    { kind: 'session', t: '3:00',  mer: 'PM', id: 'theo' },
    { kind: 'session', t: '4:00',  mer: 'PM', id: 'hannah' },
    { kind: 'group',   t: '5:00',  mer: 'PM', text: 'Anxiety skills group', seats: 6, attending: 5, dur: '90 min' }
  ];

  var requests = [
    {
      id: 'req-jordan', clientId: 'jordan', kind: 'New client',
      name: 'Jordan Aleman', ask: 'Initial session, <b>Thursday after 4:00 PM</b>, video only.',
      facts: [
        { t: 'BCBS · unverified', m: 'warn' },
        { t: 'Intake empty', m: 'alert' },
        { t: 'Consult booked Oct 8', m: '' },
        { t: 'They/them · SMS', m: '' }
      ],
      primary: 'Offer Thu 4:00 PM', secondary: 'Propose 3 times',
      fit: 'Consult booked already — this is the intake that follows it.'
    },
    {
      id: 'req-priya', clientId: 'priya', kind: 'Reschedule request',
      name: 'Priya Raman', ask: '“Can’t make <b>Thu 10/1 2:00 PM</b> — conference ran over. Any Wednesday morning?”',
      facts: [
        { t: 'Weekly · standing slot', m: '' },
        { t: 'BCBS $25 copay', m: 'ok' },
        { t: '2h notice — within policy', m: 'ok' },
        { t: 'Keeps cadence', m: '' }
      ],
      primary: 'Offer Wed 8:00 AM', secondary: 'Propose 3 times',
      fit: 'Sliding her earlier keeps the 2:00 PM slot held for her.'
    },
    {
      id: 'req-sam', clientId: 'sam', kind: 'Returning client',
      name: 'Sam Whitfield', ask: '“Ready to start again — <b>weekly, Fridays</b> if the slot’s still mine.”',
      facts: [
        { t: 'Paused since Aug 14', m: '' },
        { t: 'Consent expires Nov 2', m: 'warn' },
        { t: 'Cigna $35 copay', m: 'ok' },
        { t: 'Fri 2:00 PM free', m: 'ok' }
      ],
      primary: 'Resume Fri 2:00 PM', secondary: 'Propose 3 times',
      fit: 'Cadence restarts at the same slot — 7-week gap noted in the record.'
    }
  ];

  /* --- what a client sees at the link --- */
  var booking = {
    visits: [
      { id: 'consult', name: 'Free 15-min consult', dur: 15, desc: 'Phone · fit, practicalities, referrals out if it isn’t right.', price: 0, pay: 'No card needed' },
      { id: 'initial', name: 'Initial session', dur: 60, desc: 'In person or video · history, consent, first plan.', price: 185, pay: 'Self-pay · or copay' },
      { id: 'intake', name: 'Intake & assessment', dur: 80, desc: 'In person · full history, testing measures, treatment plan.', price: 240, pay: 'Self-pay' }
    ],
    carriers: [
      { id: 'aetna', name: 'Aetna', ok: true,  msg: '<b>Aetna · active.</b> $30 copay per session, deductible met for 2026. Member W2381 00451.' },
      { id: 'bcbs',  name: 'BCBS',  ok: true,  msg: '<b>Blue Cross · active.</b> $25 copay per session. Member BC 77120 44.' },
      { id: 'uhc',   name: 'United', ok: null, msg: '<b>United confirmation pending.</b> We verify eligibility within 1 business day and text you the result.' },
      { id: 'self',  name: 'Self-pay', ok: true, msg: '<b>Self-pay.</b> $185 initial session, $150 per return session. Superbill provided monthly for reimbursement.' }
    ],
    slots: [
      { day: 'Fri 2 Oct',  n: 2, list: [{ t: '10:00 AM', scarce: true }, { t: '11:50 AM' }] },
      { day: 'Mon 5 Oct',  n: 3, list: [{ t: '9:30 AM' }, { t: '11:00 AM' }, { t: '4:15 PM' }] },
      { day: 'Tue 6 Oct',  n: 2, list: [{ t: '1:00 PM', standing: true }, { t: '4:30 PM' }] },
      { day: 'Wed 7 Oct',  n: 2, list: [{ t: '9:30 AM' }, { t: '2:00 PM', scarce: true }] }
    ],
    concerns: ['Anxiety', 'Low mood', 'Work & burnout', 'Grief', 'Relationships', 'ADHD', 'Something else'],
    before: [
      { b: 'Aetna verified', s: '$30 copay · deductible met' },
      { b: 'Intake + PHQ-9', s: 'texted to (503) 555-0148 · takes ~6 min' },
      { b: 'Video link', s: 'opens 10 minutes before, no app needed' },
      { b: '24-hour policy', s: 'late cancellations bill $75' }
    ]
  };

  try {
    var saved = JSON.parse(localStorage.getItem('daybook-data-v2'));
    if (saved) {
      if (Array.isArray(saved.clients)) clients = saved.clients;
      if (Array.isArray(saved.timeline)) timeline = saved.timeline;
      if (Array.isArray(saved.requests)) requests = saved.requests;
    }
  } catch (e) { /* Start with examples when browser storage is unavailable. */ }

  return {
    practice: practice, week: week, clients: clients, timeline: timeline,
    requests: requests, booking: booking,
    save: function () {
      try { localStorage.setItem('daybook-data-v2', JSON.stringify({ clients: this.clients, timeline: this.timeline, requests: this.requests })); }
      catch (e) { /* The app remains usable for this session. */ }
    },
    get: function (id) {
      for (var i = 0; i < this.clients.length; i++) if (this.clients[i].id === id) return this.clients[i];
      return null;
    }
  };
})();
