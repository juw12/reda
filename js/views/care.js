// Care: medicine plan, guideline ladder with "you are here", weekly advice, avoid/comfort/don't, doctor prep.
import { plan as planStore, entries as entryStore } from '../store.js';
import { currentStep, stepAdvice, adherence, isoDate } from '../logic.js';
import { DRUGS, LADDER, AVOID, COMFORT, DONT, DOCTOR_TESTS, DOCTOR_QUESTIONS } from '../content.js';
import { t, L } from '../i18n.js';
import { esc, icon, toast, $ } from '../ui.js';
import { redFlagsCard } from './parts.js';

export function adviceText(advice) {
  const s = advice.now ? advice.now.sum : 0;
  switch (advice.code) {
    case 'no-plan': return t('aNoPlan');
    case 'log-more': return advice.need === 1 ? t('aLogMore1') : t('aLogMore', { n: advice.need });
    case 'controlled': return t('aControlled', { s });
    case 'controlled-steady': return t('aSteady', { s });
    case 'updose-unconfirmed': return t('aUpUnconfirmed');
    case 'next-step': return t('aNext', { s, d: advice.daysOnStep });
    case 'specialist': return t('aSpecialist', { s });
    case 'wait': return t('aWait', { s, d: advice.waitDays });
    default: return '';
  }
}

function list(items) {
  return `<ul class="ticks">${items.map((item) => `<li>${esc(L(item.id ?? item))}</li>`).join('')}</ul>`;
}

export function renderCare(main) {
  const today = isoDate(new Date());
  const plan = planStore.get() || { drug: '', perDay: 1, doctorOk: false, since: today, omalizumab: false, ciclosporin: false };
  const step = currentStep(plan.drug ? plan : null);
  const advice = stepAdvice({ plan: plan.drug ? plan : null, entries: entryStore.all(), todayIso: today });
  const adh = adherence(entryStore.all(), plan.drug ? plan : null, today);
  const selected = DRUGS.find((d) => d.id === plan.drug);

  main.innerHTML = `
    <div class="page">
      <header class="page-head">
        <h1>${esc(t('careTitle'))}</h1>
        <p class="lead">${esc(t('careIntro'))}</p>
      </header>

      <section class="card advice code-${advice.code}">
        <h2 class="card-title">${esc(t('adviceTitle'))}</h2>
        <p>${esc(adviceText(advice))}</p>
        ${adh ? `<p class="muted small">${esc(t('adherence', { a: adh.full, b: adh.logged }))}</p>` : ''}
        <a class="link-row" href="#/report">${icon('doc', 18)} ${esc(t('reportBtn'))} ${icon('chevron', 18)}</a>
      </section>

      <form class="card stack" id="plan-form">
        <h2 class="card-title">${esc(t('planTitle'))}</h2>
        <label class="field">
          <span>${esc(t('planDrug'))}</span>
          <select name="drug">
            <option value="">${esc(t('planPick'))}</option>
            ${DRUGS.map((d) => `<option value="${d.id}" ${d.id === plan.drug ? 'selected' : ''}>${esc(d.name)} ${esc(d.dose)}</option>`).join('')}
          </select>
        </label>
        <p class="muted small" id="std-dose">${selected ? esc(t('stdDose', { d: selected.dose })) : ''}</p>
        <div class="field">
          <span>${esc(t('planPerDay'))}</span>
          <div class="seg">${[1, 2, 3, 4].map((n) => `<label><input type="radio" name="perDay" value="${n}" ${plan.perDay === n ? 'checked' : ''}><span>${n}×</span></label>`).join('')}</div>
        </div>
        <p class="warn-text small" id="up-warn" ${plan.perDay > 1 ? '' : 'hidden'}>${esc(t('planWarnUp'))}</p>
        <label class="toggle"><input type="checkbox" name="doctorOk" ${plan.doctorOk ? 'checked' : ''}><span>${esc(t('planDoctor'))}</span></label>
        <label class="toggle"><input type="checkbox" name="omalizumab" ${plan.omalizumab ? 'checked' : ''}><span>${esc(t('planOmal'))}</span></label>
        <label class="toggle"><input type="checkbox" name="ciclosporin" ${plan.ciclosporin ? 'checked' : ''}><span>${esc(t('planCiclo'))}</span></label>
        <label class="field">
          <span>${esc(t('planSince'))}</span>
          <input type="date" name="since" value="${esc(plan.since || today)}" max="${today}">
        </label>
        <button class="btn primary wide" type="submit">${esc(t('save'))}</button>
      </form>

      <section class="card">
        <h2 class="card-title">${esc(t('ladderTitle'))}</h2>
        <ol class="ladder">
          ${LADDER.map((rung) => `
            <li class="rung ${rung.step === step ? 'here' : ''} ${rung.step < step ? 'past' : ''}">
              <span class="rung-n">${rung.step}</span>
              <div>
                <strong>${esc(L(rung.title))}</strong>
                ${rung.step === step ? `<span class="pill here-pill">${esc(t('youAreHere'))}</span>` : ''}
                <p class="muted small">${esc(L(rung.body))}</p>
              </div>
            </li>`).join('')}
        </ol>
      </section>

      <section class="card">
        <h2 class="card-title">${esc(t('comfortTitle'))}</h2>
        ${list(COMFORT)}
      </section>
      <section class="card">
        <h2 class="card-title">${esc(t('avoidTitle'))}</h2>
        ${list(AVOID)}
      </section>
      <section class="card caution">
        <h2 class="card-title">${esc(t('dontTitle'))}</h2>
        ${list(DONT)}
      </section>
      <section class="card">
        <h2 class="card-title">${esc(t('doctorTitle'))}</h2>
        <h3 class="sub">${esc(t('doctorTests'))}</h3>
        ${list(DOCTOR_TESTS.map((x) => ({ id: x })))}
        <h3 class="sub">${esc(t('doctorQs'))}</h3>
        ${list(DOCTOR_QUESTIONS.map((x) => ({ id: x })))}
      </section>
      ${redFlagsCard()}
      <p class="disclaimer">${esc(t('disclaimer'))}</p>
    </div>`;

  const form = $('#plan-form', main);
  form.addEventListener('change', () => {
    const data = new FormData(form);
    const drug = DRUGS.find((d) => d.id === data.get('drug'));
    $('#std-dose', main).textContent = drug ? t('stdDose', { d: drug.dose }) : '';
    $('#up-warn', main).hidden = Number(data.get('perDay') || 1) <= 1;
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const next = {
      drug: String(data.get('drug') || ''),
      perDay: Number(data.get('perDay') || 1),
      doctorOk: data.get('doctorOk') === 'on',
      omalizumab: data.get('omalizumab') === 'on',
      ciclosporin: data.get('ciclosporin') === 'on',
      since: String(data.get('since') || today),
    };
    const old = planStore.get();
    // A change of step restarts the 2-4 week review clock.
    if (old && old.drug && currentStep(old) !== currentStep(next) && next.since === old.since) next.since = today;
    planStore.set(next.drug ? next : null);
    toast(t('planSaved'));
    renderCare(main);
  });
}
