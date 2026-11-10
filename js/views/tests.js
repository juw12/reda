// Self-tests for physical (inducible) hives, with reference photos and timers.
import { tests as testStore } from '../store.js';
import { latestTests } from '../logic.js';
import { TESTS, LOOK, PHOTOS } from '../content.js';
import { t, L, fmtDate, lang } from '../i18n.js';
import { esc, icon, toast, $, $$ } from '../ui.js';
import { figure, illustration, redFlagsCard } from './parts.js';
import { isoDate } from '../logic.js';

const RESULT_KEY = { positive: 'rPositive', negative: 'rNegative', unsure: 'rUnsure' };
let activeTimer = null;

function stopTimer() {
  if (activeTimer) {
    clearInterval(activeTimer.id);
    activeTimer = null;
  }
}

function lastResultLine(test, latest) {
  const result = latest[test.id];
  if (!result) return `<span class="muted small">${esc(t('notTested'))}</span>`;
  const day = fmtDate(isoDate(result.at));
  return `<span class="result-tag r-${result.result}">${esc(t('lastResult', { r: t(RESULT_KEY[result.result]), d: day }))}</span>`;
}

function thumbFor(test) {
  const key = test.photos[0];
  if (key && PHOTOS[key]) return `<img src="${PHOTOS[key].file}" alt="" loading="lazy" width="96" height="72">`;
  return `<span class="thumb-illus" aria-hidden="true">${icon(test.figure === 'sun' ? 'today' : 'timer', 28)}</span>`;
}

export function renderTests(main) {
  stopTimer();
  const latest = latestTests(testStore.all());
  main.innerHTML = `
    <div class="page">
      <header class="page-head">
        <h1>${esc(t('testsTitle'))}</h1>
        <p class="lead">${esc(t('testsIntro'))}</p>
      </header>
      <ul class="plain test-list">
        ${TESTS.map((test) => `
          <li><a class="test-row card" href="#/tests/${test.id}">
            <span class="test-thumb">${thumbFor(test)}</span>
            <span class="test-text">
              <strong>${esc(L(test.name))}</strong>
              <span class="muted small">${esc(L(test.checks))}</span>
              ${lastResultLine(test, latest)}
            </span>
            ${icon('chevron', 18)}
          </a></li>`).join('')}
      </ul>
      <a class="card look-link" href="#/look">
        <span><strong>${esc(t('lookTitle'))}</strong><span class="muted small">${esc(t('lookIntro'))}</span></span>
        ${icon('chevron', 18)}
      </a>
    </div>`;
}

function fmtClock(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function renderTest(main, id) {
  stopTimer();
  const test = TESTS.find((entry) => entry.id === id);
  if (!test) {
    location.hash = '#/tests';
    return;
  }
  const latest = latestTests(testStore.all());
  const phases = [];
  if (test.timer?.apply) phases.push({ key: 'applyPhase', seconds: test.timer.apply });
  if (test.timer?.read) phases.push({ key: 'readPhase', seconds: test.timer.read });

  const photosHtml = test.photos.length
    ? test.photos.map((key, i) => figure(key, i === 0 ? L(test.positive) : L(test.name))).join('')
    : illustration(test.figure);

  main.innerHTML = `
    <div class="page">
      <header class="page-head with-back">
        <a class="icon-btn" href="#/tests" aria-label="${esc(t('back'))}">${icon('back')}</a>
        <div><p class="eyebrow">${esc(t('tabTests'))}</p><h1>${esc(L(test.name))}</h1></div>
      </header>
      <p class="lead">${esc(L(test.checks))} ${esc(L(test.common))}</p>
      ${test.safety ? `<section class="card caution"><h2 class="card-title">${icon('alert', 18)} ${esc(t('safetyFirst'))}</h2><p>${esc(L(test.safety))}</p></section>` : ''}
      <section class="card">
        <h2 class="card-title">${esc(t('howTo'))}</h2>
        <ol class="steps">${test.steps.map((step) => `<li>${esc(L(step))}</li>`).join('')}</ol>
        ${phases.length ? `
          <div class="timer" id="timer" data-phase="-1">
            <div class="timer-face"><span id="timer-label">${esc(t(phases[0].key))}</span><strong id="timer-clock">${fmtClock(phases[0].seconds)}</strong></div>
            <div class="timer-phases">${phases.map((phase, i) => `<span class="phase" data-i="${i}">${esc(t(phase.key))} · ${Math.round(phase.seconds / 60)} min</span>`).join('')}</div>
            <button class="btn primary wide" id="timer-start">${icon('timer', 18)} ${esc(t('startTimer'))}</button>
          </div>` : ''}
      </section>
      <section class="card">
        <h2 class="card-title">${esc(t('looksPositive'))}</h2>
        <p>${esc(L(test.positive))}</p>
        <div class="ref-grid">${photosHtml}</div>
        <h3 class="sub">${esc(t('looksNegative'))}</h3>
        <p class="muted">${esc(L(test.negative))}</p>
      </section>
      <section class="card" id="result-card">
        <h2 class="card-title">${esc(t('resultQ'))}</h2>
        <div class="seg three">
          ${['positive', 'negative', 'unsure'].map((r) => `<button class="seg-btn" data-result="${r}">${esc(t(RESULT_KEY[r]))}</button>`).join('')}
        </div>
        <p class="small" id="last-result">${lastResultLine(test, latest)}</p>
      </section>
      <section class="card ${latest[test.id]?.result === 'positive' ? 'highlight' : ''}">
        <h2 class="card-title">${esc(t('ifPositive'))}</h2>
        <p>${esc(L(test.ifPositive))}</p>
      </section>
    </div>`;

  $$('[data-result]', main).forEach((button) => {
    button.addEventListener('click', () => {
      testStore.add({ test: test.id, result: button.dataset.result });
      toast(t('saved'));
      renderTest(main, id);
    });
  });

  const start = $('#timer-start', main);
  if (start) {
    start.addEventListener('click', () => runTimer(main, phases));
  }
}

function runTimer(main, phases) {
  stopTimer();
  let index = 0;
  let remaining = phases[0].seconds;
  const clock = $('#timer-clock', main);
  const label = $('#timer-label', main);
  const start = $('#timer-start', main);
  const mark = () => $$('.phase', main).forEach((el) => el.classList.toggle('on', Number(el.dataset.i) === index));
  start.disabled = true;
  mark();
  const tick = () => {
    remaining -= 1;
    if (remaining <= 0) {
      index += 1;
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      if (index >= phases.length) {
        stopTimer();
        clock.textContent = '0:00';
        label.textContent = t('timerDone');
        start.disabled = false;
        toast(t('timerDone'));
        $('#result-card', main)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      remaining = phases[index].seconds;
      label.textContent = t(phases[index].key);
      mark();
    }
    clock.textContent = fmtClock(remaining);
  };
  activeTimer = { id: setInterval(tick, 1000) };
}

export function renderLook(main) {
  stopTimer();
  main.innerHTML = `
    <div class="page">
      <header class="page-head with-back">
        <a class="icon-btn" href="#/tests" aria-label="${esc(t('back'))}">${icon('back')}</a>
        <div><p class="eyebrow">${esc(t('tabTests'))}</p><h1>${esc(t('lookTitle'))}</h1></div>
      </header>
      <p class="lead">${esc(t('lookIntro'))}</p>
      <div class="ref-grid two">${LOOK.map((item) => figure(item.photo, L(item.cap), { warn: item.warn })).join('')}</div>
      ${redFlagsCard()}
    </div>`;
}

export { stopTimer, lang };
