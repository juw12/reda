// Patterns: weekly UAS7 trend, 28-day calendar, ranked triggers, history list.
import { entries as entryStore } from '../store.js';
import { rankFactors, weeklySeries, dailyScore, addDays, band } from '../logic.js';
import { FACTOR_IDS, factorLabel, BAND_TEXT } from '../content.js';
import { t, L, lang, fmtDate } from '../i18n.js';
import { esc, icon } from '../ui.js';
import { scoreChip } from './parts.js';
import { todayIso } from './today.js';

const VERDICT_KEY = { suspect: 'vSuspect', maybe: 'vMaybe', 'no-link': 'vNoLink', 'more-data': 'vMore' };

function fmt(value) {
  return value == null ? '–' : value.toFixed(1);
}

export function trendChart(all, today, weeks = 8) {
  const series = weeklySeries(all, today, weeks);
  const w = 320;
  const h = 150;
  const pad = 26;
  const step = (w - pad * 2) / Math.max(1, weeks - 1);
  const y = (sum) => h - pad - (sum / 42) * (h - pad * 2);
  const bands = [
    { from: 0, to: 6, cls: 'band-well' },
    { from: 7, to: 15, cls: 'band-mild' },
    { from: 16, to: 27, cls: 'band-moderate' },
    { from: 28, to: 42, cls: 'band-severe' },
  ];
  const points = series.map((week, i) => ({ x: pad + i * step, week }));
  const complete = points.filter((p) => p.week.complete);
  const path = complete.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${y(p.week.sum).toFixed(1)}`).join(' ');
  return `
    <svg class="trend" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(t('weeklyTrend'))}">
      ${bands.map((b) => `<rect class="${b.cls}" x="${pad}" y="${y(b.to)}" width="${w - pad * 2}" height="${y(b.from) - y(b.to)}" opacity=".35"/>`).join('')}
      ${[0, 7, 16, 28, 42].map((v) => `<text x="${pad - 6}" y="${y(v) + 4}" text-anchor="end" class="axis">${v}</text>`).join('')}
      <path d="${path}" class="trend-line" fill="none"/>
      ${points.map((p) => p.week.complete
        ? `<circle cx="${p.x}" cy="${y(p.week.sum)}" r="4.5" class="trend-dot"><title>${esc(fmtDate(p.week.end))}: ${p.week.sum}</title></circle>`
        : `<circle cx="${p.x}" cy="${h - pad}" r="3" class="trend-gap"><title>${esc(fmtDate(p.week.end))}: ${p.week.logged}/7</title></circle>`).join('')}
      ${points.filter((_, i) => i % 2 === weeks % 2 || i === weeks - 1).map((p) => `<text x="${p.x}" y="${h - 6}" text-anchor="middle" class="axis">${esc(fmtDate(p.week.end, { day: 'numeric', month: 'numeric' }))}</text>`).join('')}
    </svg>`;
}

function calendar(all, today) {
  const start = addDays(today, -27);
  const cells = [];
  for (let i = 0; i < 28; i += 1) {
    const iso = addDays(start, i);
    const score = dailyScore(all[iso]);
    const label = `${fmtDate(iso, { weekday: 'short', day: 'numeric', month: 'short' })}: ${score == null ? t('noEntry') : score + '/6'}`;
    cells.push(`<a class="cal s${score ?? 'x'} ${iso === today ? 'is-today' : ''}" href="#/log/${iso}" aria-label="${esc(label)}"><span>${Number(iso.slice(8))}</span></a>`);
  }
  return `<div class="cal-grid">${cells.join('')}</div>
    <div class="legend">${[0, 1, 2, 3, 4, 5, 6].map((s) => `<span class="cal s${s}" aria-hidden="true"></span>`).join('')}<span class="muted small">0 → 6</span></div>`;
}

export function renderPattern(main) {
  const today = todayIso();
  const all = entryStore.all();
  const loggedDays = Object.keys(all).length;
  const ranked = rankFactors(all, FACTOR_IDS);
  const shown = ranked.filter((row) => row.verdict !== 'no-link' || row.withDays >= 3).slice(0, 12);

  const factorRows = shown.map((row) => `
    <li class="factor v-${row.verdict}">
      <div class="factor-head">
        <strong>${esc(factorLabel(row.factorId, lang()))}</strong>
        <span class="verdict">${esc(t(VERDICT_KEY[row.verdict]))}</span>
      </div>
      <div class="bar-pair" aria-hidden="true">
        <span class="bar with" style="--v:${(row.withMean ?? 0) / 6}"></span>
        <span class="bar without" style="--v:${(row.withoutMean ?? 0) / 6}"></span>
      </div>
      <p class="muted small">${esc(t('withWithout', { a: fmt(row.withMean), b: fmt(row.withoutMean), n: row.withDays }))}${row.lag ? ` · ${esc(t('nextDay'))}` : ''}</p>
    </li>`).join('');

  const history = Object.keys(all).sort().reverse().slice(0, 30).map((iso) => {
    const entry = all[iso];
    const tags = (entry.factors || []).slice(0, 3).map((id) => factorLabel(id, lang())).join(', ');
    return `
      <li><a class="hist" href="#/log/${iso}">
        <span class="hist-date">${esc(fmtDate(iso, { weekday: 'short', day: 'numeric', month: 'short' }))}</span>
        ${scoreChip(entry)}
        <span class="hist-tags muted small">${esc(tags)}${entry.angio ? ' · angio' : ''}</span>
        ${icon('chevron', 16)}
      </a></li>`;
  }).join('');

  main.innerHTML = `
    <div class="page">
      <header class="page-head">
        <h1>${esc(t('patternTitle'))}</h1>
        <p class="lead">${esc(t('patternIntro'))}</p>
      </header>
      <section class="card">
        <div class="row between"><h2 class="card-title">${esc(t('weeklyTrend'))}</h2><a class="btn ghost small-btn" href="#/report">${icon('doc', 16)} ${esc(t('reportBtn'))}</a></div>
        ${trendChart(all, today)}
        <div class="band-key">${['well', 'mild', 'moderate', 'severe'].map((id) => `<span><i class="band-${id}"></i>${esc(L(BAND_TEXT[id]))}</span>`).join('')}</div>
      </section>
      <section class="card">
        <h2 class="card-title">${esc(t('calendar'))}</h2>
        ${calendar(all, today)}
      </section>
      <section class="card">
        <h2 class="card-title">${esc(t('rFactors'))}</h2>
        ${loggedDays < 10 || !factorRows ? `<p class="muted">${esc(t('patternEmpty'))}</p>` : `<ul class="factors">${factorRows}</ul>`}
        <p class="note">${esc(t('honest'))}</p>
      </section>
      <section class="card">
        <h2 class="card-title">${esc(t('history'))}</h2>
        ${history ? `<ul class="plain hist-list">${history}</ul>` : `<p class="muted">${esc(t('streakNone'))}</p>`}
      </section>
    </div>`;
}

export { band };
