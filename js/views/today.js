// Today: check-in summary, 7-day ribbon, dose, next step. Log: the daily form.
import { entries as entryStore, plan as planStore, photos, shrinkImage } from '../store.js';
import { isoDate, dailyScore, stepAdvice, needsEmergency, addDays } from '../logic.js';
import { UAS_WHEALS, UAS_ITCH, FACTOR_GROUPS, DRUGS } from '../content.js';
import { t, L, lang, fmtDate } from '../i18n.js';
import { esc, icon, toast, scaleMark, $, $$ } from '../ui.js';
import { ribbon, redFlagsCard, scoreChip } from './parts.js';
import { adviceText } from './care.js';

export function todayIso() {
  return isoDate(new Date());
}

export function renderToday(main) {
  const today = todayIso();
  const all = entryStore.all();
  const entry = all[today];
  const plan = planStore.get();
  const advice = stepAdvice({ plan, entries: all, todayIso: today });
  const drug = plan && DRUGS.find((d) => d.id === plan.drug);

  const checkin = entry
    ? `
      <section class="card checkin done">
        <div class="row between">
          <div>
            <p class="eyebrow">${esc(t('checkinDone'))}</p>
            <p class="big-score">${dailyScore(entry)}<span>/6</span></p>
          </div>
          <div class="marks">
            <span>${scaleMark(entry.wheals)} ${esc(t('whealShort'))}: ${esc(L(UAS_WHEALS[entry.wheals]))}</span>
            <span>${scaleMark(entry.itch)} ${esc(t('itchShort'))}: ${esc(L(UAS_ITCH[entry.itch]))}</span>
          </div>
        </div>
        <a class="btn ghost" href="#/log/${today}">${esc(t('checkinEdit'))}</a>
      </section>`
    : `
      <section class="card checkin">
        <h2 class="card-title">${esc(t('greet'))}</h2>
        <p class="muted">${esc(t('streakNone'))}</p>
        <a class="btn primary wide" href="#/log/${today}">${icon('plus', 18)} ${esc(t('checkinTitle'))}</a>
      </section>`;

  const dose = plan && drug
    ? `
      <section class="card dose">
        <div class="row between">
          <div>
            <p class="eyebrow">${esc(t('doseToday'))}</p>
            <p class="dose-name">${esc(drug.name)} ${esc(drug.dose)}</p>
          </div>
          <div class="stepper" role="group" aria-label="${esc(t('dosesQ'))}">
            ${Array.from({ length: plan.perDay || 1 }, (_, i) => `
              <button class="pill-btn ${entry && entry.doses > i ? 'on' : ''}" data-dose="${i + 1}" aria-pressed="${entry && entry.doses > i}" aria-label="${i + 1}">${icon('check', 18)}</button>`).join('')}
          </div>
        </div>
        <p class="muted small">${esc(t('doseOf', { a: entry?.doses || 0, b: plan.perDay || 1 }))}</p>
      </section>`
    : '';

  main.innerHTML = `
    <div class="page">
      <header class="page-head">
        <p class="eyebrow">${esc(fmtDate(today, { weekday: 'long', day: 'numeric', month: 'long' }))}</p>
        <h1>${esc(t('tabToday'))}</h1>
      </header>
      ${entry && needsEmergency(entry) ? emergencyBanner() : ''}
      ${checkin}
      <section class="card">
        <h2 class="card-title">${esc(t('week'))}</h2>
        ${ribbon(all, today)}
        <p class="muted small">${esc(t('uasWhat'))}</p>
      </section>
      ${dose}
      <section class="card next">
        <h2 class="card-title">${esc(t('nextTitle'))}</h2>
        <p>${esc(adviceText(advice))}</p>
        <a class="link-row" href="#/care">${esc(t('tabCare'))} ${icon('chevron', 18)}</a>
      </section>
      ${redFlagsCard()}
      <p class="disclaimer">${esc(t('disclaimer'))}</p>
    </div>`;

  $$('[data-dose]', main).forEach((button) => {
    button.addEventListener('click', () => {
      const count = Number(button.dataset.dose);
      const current = entryStore.get(today) || { factors: [], photos: [] };
      const next = current.doses === count ? count - 1 : count;
      entryStore.put(today, { ...current, doses: next });
      renderToday(main);
    });
  });
}

function emergencyBanner() {
  return `
    <section class="card emergency" role="alert">
      <h2 class="card-title">${icon('alert', 20)} ${esc(t('emergencyTitle'))}</h2>
      <p>${esc(t('emergencyBody'))}</p>
      <a class="btn danger-btn" href="tel:112">${icon('phone', 18)} ${esc(t('emergencyCall'))}</a>
    </section>`;
}

function choice(name, options, value) {
  return options.map((option) => `
    <label class="choice">
      <input type="radio" name="${name}" value="${option.v}" ${value === option.v ? 'checked' : ''} required>
      <span class="choice-body">
        ${scaleMark(option.v)}
        <span class="choice-text"><strong>${esc(L(option))}</strong><small>${esc(L(option.hint))}</small></span>
      </span>
    </label>`).join('');
}

function toggle(name, label, checked) {
  return `<label class="toggle"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''}><span>${esc(label)}</span></label>`;
}

export function renderLog(main, iso) {
  const existing = entryStore.get(iso) || {};
  const plan = planStore.get();
  const drug = plan && DRUGS.find((d) => d.id === plan.drug);
  const factors = new Set(existing.factors || []);
  let photoIds = [...(existing.photos || [])];
  const isToday = iso === todayIso();
  const title = isToday ? t('today') : iso === addDays(todayIso(), -1) ? t('yesterday') : fmtDate(iso, { weekday: 'long', day: 'numeric', month: 'long' });

  main.innerHTML = `
    <div class="page">
      <header class="page-head with-back">
        <a class="icon-btn" href="#/" aria-label="${esc(t('back'))}">${icon('back')}</a>
        <div><p class="eyebrow">${esc(t('checkinTitle'))}</p><h1>${esc(title)}</h1></div>
      </header>
      <form id="log-form" class="stack" novalidate>
        <fieldset class="card">
          <legend class="q">${esc(t('whealsQ'))}</legend>
          <div class="choices">${choice('wheals', UAS_WHEALS, existing.wheals)}</div>
        </fieldset>
        <fieldset class="card">
          <legend class="q">${esc(t('itchQ'))}</legend>
          <div class="choices">${choice('itch', UAS_ITCH, existing.itch)}</div>
        </fieldset>
        <fieldset class="card">
          <legend class="q">${esc(t('angioQ'))}</legend>
          <div class="seg">
            <label><input type="radio" name="angio" value="0" ${!existing.angio ? 'checked' : ''}><span>${esc(t('no'))}</span></label>
            <label><input type="radio" name="angio" value="1" ${existing.angio ? 'checked' : ''}><span>${esc(t('yes'))}</span></label>
          </div>
          <div class="red-q">
            <p class="q small">${esc(t('redQ'))}</p>
            ${toggle('throat', t('redThroat'), existing.throat)}
            ${toggle('breathing', t('redBreath'), existing.breathing)}
            ${toggle('faint', t('redFaint'), existing.faint)}
          </div>
        </fieldset>
        <fieldset class="card">
          <legend class="q">${esc(t('factorsQ'))}</legend>
          <p class="muted small">${esc(t('factorsHint'))}</p>
          ${FACTOR_GROUPS.map((group) => `
            <p class="group-label">${esc(L(group.label))}</p>
            <div class="chips">
              ${group.items.map((item) => `
                <label class="chip"><input type="checkbox" name="factor" value="${item.id}" ${factors.has(item.id) ? 'checked' : ''}><span>${esc(lang() === 'id' ? item.id_ : item.en)}</span></label>`).join('')}
            </div>`).join('')}
          <label class="field">
            <span>${esc(t('foodsQ'))}</span>
            <input type="text" name="foods" value="${esc(existing.foods || '')}" placeholder="${esc(t('foodsHint'))}" autocomplete="off">
          </label>
        </fieldset>
        <fieldset class="card">
          <legend class="q">${esc(t('dosesQ'))}</legend>
          ${drug
            ? `<div class="seg">${[0, 1, 2, 3, 4].map((n) => `<label><input type="radio" name="doses" value="${n}" ${(existing.doses ?? (isToday ? null : 0)) === n ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div>
               <p class="muted small">${esc(drug.name)} ${esc(drug.dose)} · ${esc(t('planned', { b: plan.perDay }))}</p>`
            : `<p class="muted">${esc(t('noPlan'))}</p>`}
        </fieldset>
        <fieldset class="card">
          <legend class="q">${esc(t('photosQ'))}</legend>
          <div class="thumbs" id="thumbs"></div>
          <label class="btn ghost">
            ${icon('camera', 18)} ${esc(t('addPhoto'))}
            <input type="file" accept="image/*" capture="environment" id="photo-input" hidden>
          </label>
          <label class="field">
            <span>${esc(t('noteQ'))}</span>
            <textarea name="note" rows="3">${esc(existing.note || '')}</textarea>
          </label>
        </fieldset>
        <div class="sticky-actions">
          ${entryStore.get(iso) ? `<button type="button" class="btn ghost" id="delete-entry">${esc(t('delete'))}</button>` : ''}
          <button type="submit" class="btn primary wide">${esc(t('save'))}</button>
        </div>
      </form>
    </div>`;

  const form = $('#log-form', main);
  const thumbs = $('#thumbs', main);

  async function drawThumbs() {
    const parts = await Promise.all(photoIds.map(async (id) => {
      const blob = await photos.get(id).catch(() => null);
      if (!blob) return '';
      const url = URL.createObjectURL(blob);
      return `<div class="thumb"><img src="${url}" alt=""><button type="button" class="thumb-x" data-remove="${id}" aria-label="${esc(t('delete'))}">${icon('close', 16)}</button></div>`;
    }));
    thumbs.innerHTML = parts.join('');
    $$('[data-remove]', thumbs).forEach((button) => button.addEventListener('click', () => {
      photoIds = photoIds.filter((id) => id !== button.dataset.remove);
      photos.remove(button.dataset.remove).catch(() => {});
      drawThumbs();
    }));
  }
  drawThumbs();

  $('#photo-input', main).addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const blob = await shrinkImage(file);
    photoIds.push(await photos.put(blob));
    drawThumbs();
  });

  const deleteButton = $('#delete-entry', main);
  if (deleteButton) {
    deleteButton.addEventListener('click', () => {
      entryStore.remove(iso);
      toast(t('delete'));
      location.hash = '#/';
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    if (data.get('wheals') == null || data.get('itch') == null) {
      const first = data.get('wheals') == null ? 'wheals' : 'itch';
      form.querySelector(`[name="${first}"]`).closest('fieldset').classList.add('need');
      form.querySelector(`[name="${first}"]`).focus();
      return;
    }
    const entry = {
      wheals: Number(data.get('wheals')),
      itch: Number(data.get('itch')),
      angio: data.get('angio') === '1',
      throat: data.get('throat') === 'on',
      breathing: data.get('breathing') === 'on',
      faint: data.get('faint') === 'on',
      factors: data.getAll('factor'),
      foods: String(data.get('foods') || '').trim(),
      doses: data.get('doses') == null ? (existing.doses ?? null) : Number(data.get('doses')),
      note: String(data.get('note') || '').trim(),
      photos: photoIds,
    };
    entryStore.put(iso, entry);
    toast(t('saved'));
    location.hash = needsEmergency(entry) ? '#/' : (isToday ? '#/' : '#/pattern');
  });
}

export { scoreChip };
