// Shared view pieces: the 7-day welt ribbon, band pill, red-flag card, photo figure.
import { uas7, band, dailyScore, addDays } from '../logic.js';
import { BAND_TEXT, RED_FLAGS, PHOTOS } from '../content.js';
import { t, L, fmtDate } from '../i18n.js';
import { esc, icon } from '../ui.js';

export function bandPill(sum) {
  const b = band(sum);
  return `<span class="pill band-${b.id}">${esc(L(BAND_TEXT[b.id]))}</span>`;
}

// Signature element: seven welts, height and tone by daily score (0-6).
export function ribbon(entries, endIso, { link = true } = {}) {
  const result = uas7(entries, endIso);
  const cells = result.days.map(({ iso, score }) => {
    const level = score == null ? 'none' : `s${score}`;
    const label = `${fmtDate(iso, { weekday: 'short', day: 'numeric' })}: ${score == null ? t('noEntry') : score + '/6'}`;
    const inner = `<span class="welt ${level}" style="--h:${score == null ? 0 : score}"></span><span class="welt-day">${esc(fmtDate(iso, { weekday: 'narrow' }))}</span>`;
    return link
      ? `<a class="welt-cell" href="#/log/${iso}" aria-label="${esc(label)}">${inner}</a>`
      : `<span class="welt-cell" aria-label="${esc(label)}">${inner}</span>`;
  });
  const summary = result.complete
    ? `<div class="uas"><span class="uas-num">${result.sum}</span><span class="uas-of">/42</span> ${bandPill(result.sum)}</div>`
    : `<p class="muted small">${esc(t('uas7Partial', { n: result.logged }))}</p>`;
  return `
    <div class="ribbon" role="img" aria-label="${esc(t('week'))}">${cells.join('')}</div>
    <div class="ribbon-foot"><span class="label">${esc(t('uas7'))}</span>${summary}</div>`;
}

export function redFlagsCard() {
  return `
    <section class="card danger" aria-labelledby="rf-title">
      <h2 id="rf-title" class="card-title">${icon('alert', 20)} ${esc(t('redFlagsTitle'))}</h2>
      <ul class="plain">${RED_FLAGS.map((flag) => `<li>${esc(L(flag))}</li>`).join('')}</ul>
      <a class="btn danger-btn" href="tel:112">${icon('phone', 18)} ${esc(t('emergencyCall'))}</a>
    </section>`;
}

export function figure(photoKey, caption, { warn = false } = {}) {
  const photo = PHOTOS[photoKey];
  if (!photo) return '';
  return `
    <figure class="ref ${warn ? 'warn' : ''}">
      <img src="${photo.file}" alt="${esc(caption)}" loading="lazy" width="720" height="540">
      <figcaption>
        <span>${esc(caption)}</span>
        <a class="credit" href="${photo.page}" target="_blank" rel="noopener">${esc(t('photoCredit', { a: photo.author, l: photo.license }))}</a>
      </figcaption>
    </figure>`;
}

// Hand-drawn illustrations for tests without a free photo.
export function illustration(kind) {
  if (kind === 'heat') {
    return `
      <figure class="ref illus">
        <svg viewBox="0 0 320 180" role="img" aria-label="${esc(t('illus'))}">
          <rect x="0" y="0" width="320" height="180" fill="var(--skin-bg)"/>
          <path d="M0 120 Q160 95 320 120 L320 180 L0 180 Z" fill="var(--skin)"/>
          <ellipse cx="160" cy="118" rx="44" ry="10" fill="var(--welt-2)" opacity=".85"/>
          <rect x="128" y="40" width="64" height="72" rx="8" fill="none" stroke="var(--text)" stroke-width="2.5"/>
          <path d="M136 70h48" stroke="var(--accent)" stroke-width="2.5"/>
          <path d="M148 30c4-8-4-10 0-18M160 30c4-8-4-10 0-18M172 30c4-8-4-10 0-18" stroke="var(--welt-3)" stroke-width="2" fill="none"/>
        </svg>
        <figcaption><span>${esc(t('illus'))}: ±44°C, 5 min</span></figcaption>
      </figure>`;
  }
  return `
    <figure class="ref illus">
      <svg viewBox="0 0 320 180" role="img" aria-label="${esc(t('illus'))}">
        <rect x="0" y="0" width="320" height="180" fill="var(--skin-bg)"/>
        <circle cx="60" cy="44" r="20" fill="none" stroke="var(--welt-3)" stroke-width="2.5"/>
        <path d="M60 12v-8M60 84v-8M28 44h-8M100 44h-8M37 21l-6-6M89 73l-6-6M37 67l-6 6M89 15l-6 6" stroke="var(--welt-3)" stroke-width="2.5"/>
        <path d="M0 130 Q160 100 320 130 L320 180 L0 180 Z" fill="var(--skin)"/>
        <path d="M150 180 L150 128 Q160 124 320 132 L320 180 Z" fill="var(--surface-2)" opacity=".9"/>
        <circle cx="70" cy="136" r="7" fill="var(--welt-2)"/><circle cx="96" cy="130" r="5" fill="var(--welt-2)"/>
        <circle cx="118" cy="140" r="6" fill="var(--welt-2)"/><circle cx="84" cy="150" r="5" fill="var(--welt-2)"/>
      </svg>
      <figcaption><span>${esc(t('illus'))}</span></figcaption>
    </figure>`;
}

export function scoreChip(entry) {
  const score = dailyScore(entry);
  return score == null ? '' : `<span class="chip-score s${score}">${score}/6</span>`;
}

export function lastNDays(todayIso, n) {
  return Array.from({ length: n }, (_, i) => addDays(todayIso, -(n - 1 - i)));
}
