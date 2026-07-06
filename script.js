document.getElementById('year').textContent = new Date().getFullYear();

// Hamburger menu
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));
}

// ── TERM LOGIC ────────────────────────────────────────────────────────────────
// WA school term dates (start dates, inclusive). Update each year as needed.
const WA_TERMS = [
  { name: 'Term 1, 2026', start: new Date('2026-01-28'), end: new Date('2026-04-09'), weeks: 10 },
  { name: 'Term 2, 2026', start: new Date('2026-04-27'), end: new Date('2026-06-26'), weeks: 10 },
  { name: 'Term 3, 2026', start: new Date('2026-07-20'), end: new Date('2026-09-25'), weeks: 10 },
  { name: 'Term 4, 2026', start: new Date('2026-10-12'), end: new Date('2026-12-17'), weeks: 10 },
];

function getCurrentOrUpcomingTerm() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  // If currently in a term, return it
  for (const t of WA_TERMS) {
    if (now >= t.start && now <= t.end) return { term: t, inProgress: true };
  }
  // Otherwise return the next upcoming term
  const upcoming = WA_TERMS.find(t => t.start > now);
  return upcoming ? { term: upcoming, inProgress: false } : { term: WA_TERMS[WA_TERMS.length - 1], inProgress: false };
}

function weeksRemaining(term) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (now < term.start) return term.weeks; // hasn't started yet
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const elapsed = Math.floor((now - term.start) / msPerWeek);
  return Math.max(0, term.weeks - elapsed);
}

// ── REGISTRATION FORM ─────────────────────────────────────────────────────────
const form = document.getElementById('enrol-form');
if (form) {
  const { term, inProgress } = getCurrentOrUpcomingTerm();
  const remaining = weeksRemaining(term);
  // Populate term display
  document.getElementById('term-name').textContent = term.name;
  document.getElementById('term-weeks').textContent =
    inProgress
      ? `${remaining} of ${term.weeks} lessons remaining`
      : `${term.weeks} lessons · starts ${term.start.toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })}`;

  const FULL_PRICES  = [0, 300, 540, 720, 840];
  const HOURLY_RATES = [0,  20,  18,  16,  14];

  function updatePriceSummary() {
    const subjects = Array.from(form.querySelectorAll('input[name="subjects"]:checked')).map(el => el.value);
    const summary = document.getElementById('price-summary');
    if (subjects.length === 0) { summary.style.display = 'none'; return; }

    const count = subjects.length;
    const total = FULL_PRICES[count];
    const rate  = HOURLY_RATES[count];

    document.getElementById('price-total').textContent = `$${total}`;
    document.getElementById('price-breakdown').textContent =
      `${count} subject${count > 1 ? 's' : ''} — $${rate}/hr — ${term.name}`;
    summary.style.display = 'block';
  }

  form.querySelectorAll('input[name="subjects"]')
    .forEach(el => el.addEventListener('change', updatePriceSummary));

  // Submit
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const subjects = Array.from(form.querySelectorAll('input[name="subjects"]:checked')).map(el => el.value);
    const errorEl  = document.getElementById('form-error');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (subjects.length === 0) {
      errorEl.textContent = 'Please select at least one subject.';
      errorEl.style.display = 'block';
      errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    errorEl.style.display = 'none';

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    const data = new FormData(form);
    const total = FULL_PRICES[subjects.length];
    data.append('term', term.name);
    data.append('total-due', `$${total}`);

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        form.style.display = 'none';
        const success = document.getElementById('form-success');
        success.style.display = 'block';
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const json = await res.json();
        const msg = json.errors ? json.errors.map(e => e.message).join(', ') : 'Something went wrong. Please try again.';
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Enrolment →';
      }
    } catch {
      errorEl.textContent = 'Network error — please check your connection and try again.';
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Enrolment →';
    }
  });
}
