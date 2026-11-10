// Pure functions: dates, UAS7 scoring, control bands, trigger patterns, step guidance.
// No DOM and no storage here, so tests can run them directly.

export const DAY_MS = 86400000;

export function isoDate(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso, days) {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

export function daysBetween(fromIso, toIso) {
  return Math.round((parseIso(toIso) - parseIso(fromIso)) / DAY_MS);
}

// UAS (EAACI/GA2LEN/WAO guideline): wheals 0-3 + itch 0-3 per day, 0-6.
export function dailyScore(entry) {
  if (!entry || entry.wheals == null || entry.itch == null) return null;
  return clamp(entry.wheals, 0, 3) + clamp(entry.itch, 0, 3);
}

function clamp(value, low, high) {
  return Math.min(high, Math.max(low, Number(value) || 0));
}

// UAS7 = sum of 7 consecutive daily scores ending on `endIso`.
// Only complete when all 7 days are logged; otherwise `complete` is false.
export function uas7(entries, endIso) {
  let sum = 0;
  let logged = 0;
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const iso = addDays(endIso, -i);
    const score = dailyScore(entries[iso]);
    days.push({ iso, score });
    if (score != null) {
      sum += score;
      logged += 1;
    }
  }
  return { sum, logged, complete: logged === 7, days };
}

// Disease-activity bands for UAS7 (0-42).
export const BANDS = [
  { id: 'free', min: 0, max: 0 },
  { id: 'well', min: 1, max: 6 },
  { id: 'mild', min: 7, max: 15 },
  { id: 'moderate', min: 16, max: 27 },
  { id: 'severe', min: 28, max: 42 },
];

export function band(sum) {
  return BANDS.find((b) => sum >= b.min && sum <= b.max) || BANDS[BANDS.length - 1];
}

// Weekly UAS7 series (non-overlapping weeks ending today), oldest first.
export function weeklySeries(entries, todayIso, weeks) {
  const out = [];
  for (let w = weeks - 1; w >= 0; w -= 1) {
    const end = addDays(todayIso, -7 * w);
    const result = uas7(entries, end);
    out.push({ end, ...result });
  }
  return out;
}

// Trigger patterns: compare the daily score on days with a factor vs without.
// lag 0 = same day, lag 1 = the factor's effect on the next day (foods, alcohol).
// Honest thresholds: at least MIN_DAYS on each side before saying anything.
export const MIN_DAYS = 3;
export const SUSPECT_DIFF = 1.0;
export const NONE_DIFF = 0.5;

export function factorStats(entries, factorId, lag = 0) {
  const withScores = [];
  const withoutScores = [];
  for (const [iso, entry] of Object.entries(entries)) {
    const target = lag ? entries[addDays(iso, lag)] : entry;
    const score = dailyScore(target);
    if (score == null) continue;
    const has = (entry.factors || []).includes(factorId) || foodTokens(entry).includes(factorId);
    (has ? withScores : withoutScores).push(score);
  }
  const mean = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null);
  const withMean = mean(withScores);
  const withoutMean = mean(withoutScores);
  const diff = withMean != null && withoutMean != null ? withMean - withoutMean : null;
  let verdict = 'more-data';
  if (withScores.length >= MIN_DAYS && withoutScores.length >= MIN_DAYS) {
    if (diff >= SUSPECT_DIFF) verdict = 'suspect';
    else if (diff >= NONE_DIFF) verdict = 'maybe';
    else verdict = 'no-link';
  }
  return {
    factorId,
    lag,
    withDays: withScores.length,
    withoutDays: withoutScores.length,
    withMean,
    withoutMean,
    diff,
    verdict,
  };
}

// Free-text foods, comma or newline separated, normalised to "food:<word>".
export function foodTokens(entry) {
  if (!entry || !entry.foods) return [];
  return entry.foods
    .split(/[,;\n]+/)
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length > 1)
    .map((word) => `food:${word}`);
}

export function allFoodTokens(entries, minDays = MIN_DAYS) {
  const counts = {};
  for (const entry of Object.values(entries)) {
    for (const token of new Set(foodTokens(entry))) counts[token] = (counts[token] || 0) + 1;
  }
  return Object.keys(counts).filter((token) => counts[token] >= minDays).sort();
}

const VERDICT_ORDER = { suspect: 0, maybe: 1, 'no-link': 2, 'more-data': 3 };

// Rank every factor (and frequent foods) by evidence, both lags; best lag per factor.
export function rankFactors(entries, factorIds) {
  const ids = [...factorIds, ...allFoodTokens(entries)];
  const rows = ids.map((id) => {
    const same = factorStats(entries, id, 0);
    const next = factorStats(entries, id, 1);
    const pick = (next.diff ?? -9) > (same.diff ?? -9) + 0.25 && next.verdict !== 'more-data' ? next : same;
    return pick;
  });
  return rows
    .filter((row) => row.withDays > 0)
    .sort((a, b) => VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict] || (b.diff ?? -9) - (a.diff ?? -9));
}

// Treatment step from the plan (guideline algorithm).
// 1 = standard-dose 2nd-gen H1 antihistamine, 2 = up to 4x, 3 = + omalizumab, 4 = + ciclosporin.
export function currentStep(plan) {
  if (!plan || !plan.drug) return 0;
  if (plan.ciclosporin) return 4;
  if (plan.omalizumab) return 3;
  return (plan.perDay || 1) > 1 ? 2 : 1;
}

// Guidance from control + time on the current step. Never prescribes; always "ask your doctor".
// Guideline: if not controlled after 2-4 weeks on a step, consider the next step.
export function stepAdvice({ plan, entries, todayIso }) {
  const step = currentStep(plan);
  const now = uas7(entries, todayIso);
  const prev = uas7(entries, addDays(todayIso, -7));
  const daysOnStep = plan && plan.since ? daysBetween(plan.since, todayIso) : 0;
  if (step === 0) return { code: 'no-plan', step, now };
  if (!now.complete) return { code: 'log-more', step, now, need: 7 - now.logged };
  const controlled = now.sum <= 6;
  if (controlled) {
    const longControl = prev.complete && prev.sum <= 6;
    return { code: longControl ? 'controlled-steady' : 'controlled', step, now };
  }
  if (plan.perDay > 1 && !plan.doctorOk) return { code: 'updose-unconfirmed', step, now };
  if (daysOnStep >= 14) return { code: step >= 4 ? 'specialist' : 'next-step', step, now, daysOnStep };
  return { code: 'wait', step, now, daysOnStep, waitDays: 14 - daysOnStep };
}

// Red flags that mean "emergency now", not "log it".
export function needsEmergency(entry) {
  return Boolean(entry && (entry.breathing || entry.throat || entry.faint));
}

// Adherence: share of logged days in the window where doses taken >= planned.
export function adherence(entries, plan, todayIso, days = 14) {
  if (!plan || !plan.drug) return null;
  let logged = 0;
  let full = 0;
  for (let i = 0; i < days; i += 1) {
    const entry = entries[addDays(todayIso, -i)];
    if (!entry || entry.doses == null) continue;
    logged += 1;
    if (entry.doses >= (plan.perDay || 1)) full += 1;
  }
  return logged ? { logged, full, rate: full / logged } : null;
}

// Self-test results: latest result per test id.
export function latestTests(results) {
  const latest = {};
  for (const result of results || []) {
    if (!latest[result.test] || result.at > latest[result.test].at) latest[result.test] = result;
  }
  return latest;
}

// Deterministic demo data (35 days) for screenshots and first look.
export function demoEntries(todayIso) {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const entries = {};
  for (let i = 34; i >= 0; i -= 1) {
    const iso = addDays(todayIso, -i);
    if (i > 0 && rand() < 0.06) continue; // a few missed days, like real life
    const factors = [];
    if (rand() < 0.3) factors.push('heat');
    if (rand() < 0.22) factors.push('nsaid');
    if (rand() < 0.35) factors.push('stress');
    if (rand() < 0.25) factors.push('poor-sleep');
    if (rand() < 0.2) factors.push('tight');
    if (rand() < 0.15) factors.push('alcohol');
    const improving = i < 14 ? 1 : 0; // started daily antihistamine two weeks ago
    let base = 1.6 + rand() * 1.6 - improving * 1.3;
    if (factors.includes('nsaid')) base += 2.2;
    if (factors.includes('heat')) base += 1.1;
    if (factors.includes('poor-sleep')) base += 0.6;
    const total = Math.max(0, Math.min(6, Math.round(base)));
    const wheals = Math.min(3, Math.ceil(total / 2));
    const itch = Math.min(3, total - wheals + (rand() < 0.3 ? 1 : 0));
    const foods = ['nasi, ayam goreng', 'mie, telur', 'seafood, nasi', 'roti, kopi', 'sate, nasi'][Math.floor(rand() * 5)];
    entries[iso] = {
      wheals,
      itch: Math.max(0, Math.min(3, itch)),
      angio: total >= 5 && rand() < 0.5,
      factors,
      foods,
      doses: i < 14 ? (rand() < 0.88 ? 1 : 0) : 0,
      note: '',
      photos: [],
      savedAt: parseIso(iso).getTime() + 20 * 3600000,
    };
  }
  return entries;
}
